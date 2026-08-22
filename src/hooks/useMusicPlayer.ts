import { useSyncExternalStore } from "react";

export interface SongMeta {
  id: number;
  name: string;
  artists: string;
  /** 秒 */
  duration?: number;
  /** 封面图（https 地址） */
  cover?: string;
}

export interface LyricLine {
  time: number;
  text: string;
}

/** 播放模式：顺序 / 随机 / 单曲循环 */
export type PlayMode = "order" | "shuffle" | "loop";

// ── localStorage 持久化（播放列表 + 音量） ──
const LS_PLAYLIST = "music.playlist";
const LS_VOLUME = "music.volume";

function loadPlaylist(): SongMeta[] {
  try {
    const raw = localStorage.getItem(LS_PLAYLIST);
    if (!raw) return [];
    const list = JSON.parse(raw) as SongMeta[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function loadVolume(): number {
  try {
    const v = Number(localStorage.getItem(LS_VOLUME));
    return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 0.8;
  } catch {
    return 0.8;
  }
}

function formatTime(sec: number): string {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// 同源代理请求：开发环境走 Vite 中间件，生产环境走 Worker /api/proxy，
// 统一规避浏览器跨域限制（网易云 API 未开放 CORS）。
async function proxyFetch(url: string): Promise<Response> {
  return fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
}

function parseLyric(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const tag = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
  for (const raw of lrc.split("\n")) {
    const times: number[] = [];
    tag.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = tag.exec(raw))) {
      const min = Number(m[1]);
      const sec = Number(m[2]);
      const frac = (m[3] ?? "0").padEnd(3, "0").slice(0, 3);
      times.push(min * 60 + sec + Number(frac) / 1000);
    }
    const text = raw.replace(/\[[^\]]*\]/g, "").trim();
    if (!text || times.length === 0) continue;
    for (const t of times) lines.push({ time: t, text });
  }
  return lines.sort((a, b) => a.time - b.time);
}

async function searchSongs(keyword: string): Promise<SongMeta[]> {
  const src = `https://music.163.com/api/search/get/web?s=${encodeURIComponent(
    keyword,
  )}&type=1&offset=0&limit=10&total=true`;
  try {
    const res = await proxyFetch(src);
    const json = (await res.json()) as {
      result?: {
        songs?: Array<{
          id: number;
          name: string;
          artists: Array<{ name: string }>;
        }>;
      };
    };
    const songs = (json.result?.songs ?? []).slice(0, 10);
    if (songs.length === 0) return [];
    const base: SongMeta[] = songs.map((s) => ({
      id: s.id,
      name: s.name,
      artists: (s.artists ?? []).map((a) => a.name).join(", "),
    }));
    // 用详情接口补充封面与时长（一次批量请求）
    const details = await fetchSongDetails(songs.map((s) => s.id));
    return base.map((s) => ({ ...s, ...(details.get(s.id) ?? {}) }));
  } catch {
    return [];
  }
}

// 批量详情：ids=[1,2,3] 返回时长（毫秒）与专辑封面
async function fetchSongDetails(
  ids: number[],
): Promise<Map<number, { duration?: number; cover?: string }>> {
  const map = new Map<number, { duration?: number; cover?: string }>();
  if (ids.length === 0) return map;
  const src = `https://music.163.com/api/song/detail?ids=[${ids.join(",")}]`;
  try {
    const res = await proxyFetch(src);
    const json = (await res.json()) as {
      songs?: Array<{
        id: number;
        duration?: number;
        album?: { picUrl?: string };
      }>;
    };
    for (const s of json.songs ?? []) {
      map.set(s.id, {
        duration: s.duration ? Math.round(s.duration / 1000) : undefined,
        cover: s.album?.picUrl
          ? s.album.picUrl.replace(/^http:\/\//, "https://")
          : undefined,
      });
    }
  } catch {
    // 详情失败不影响搜索结果
  }
  return map;
}

async function fetchSongUrl(id: number): Promise<string | null> {
  // 优先 v1 接口；部分歌曲/地区为空时回退到 player/url（实测可返回免费 CDN 地址）
  const v1 = `https://music.163.com/api/song/enhance/url/v1?id=${id}&br=128000`;
  const legacy = `https://music.163.com/api/song/enhance/player/url?ids=[${id}]&br=128000`;
  for (const src of [v1, legacy]) {
    try {
      const res = await proxyFetch(src);
      const json = (await res.json()) as {
        data?: Array<{ url?: string | null }>;
      };
      const url = json.data?.[0]?.url;
      if (url) {
        // 网易云返回的 CDN 地址为 http，统一升级为 https 以避免混合内容被拦截
        return url.replace(/^http:\/\//, "https://");
      }
    } catch {
      // 尝试下一个
    }
  }
  return null;
}

async function fetchLyrics(id: number): Promise<LyricLine[]> {
  const src = `https://music.163.com/api/song/lyric?id=${id}&lv=1&kv=1&tv=-1`;
  try {
    const res = await proxyFetch(src);
    const json = (await res.json()) as { lrc?: { lyric?: string } };
    return parseLyric(json.lrc?.lyric ?? "");
  } catch {
    return [];
  }
}

// ── 全局共享播放器状态（模块级单例，所有 useMusicPlayer 调用共享同一播放器） ──
let currentSong: SongMeta | null = null;
let playing = false;
let loadingUrlId: number | null = null;
let currentTime = 0;
let duration = 0;
let volume = loadVolume();
let lyrics: LyricLine[] = [];
let error = "";
let mode: PlayMode = "order";

let audio: HTMLAudioElement | null = null;
let playlist: SongMeta[] = loadPlaylist();
// 随机模式下的播放顺序（播放列表索引的洗牌排列）：一轮内每首歌恰好播放一次
let shuffleOrder: number[] = [];

interface MusicSnapshot {
  currentSong: SongMeta | null;
  playing: boolean;
  loadingUrlId: number | null;
  currentTime: number;
  duration: number;
  volume: number;
  lyrics: LyricLine[];
  error: string;
  playlist: SongMeta[];
  mode: PlayMode;
}

let snapshot: MusicSnapshot = {
  currentSong,
  playing,
  loadingUrlId,
  currentTime,
  duration,
  volume,
  lyrics,
  error,
  playlist,
  mode,
};

const listeners = new Set<() => void>();

function makeSnapshot(): MusicSnapshot {
  return {
    currentSong,
    playing,
    loadingUrlId,
    currentTime,
    duration,
    volume,
    lyrics,
    error,
    playlist,
    mode,
  };
}

function emit() {
  snapshot = makeSnapshot();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): MusicSnapshot {
  return snapshot;
}

function persistPlaylist() {
  try {
    localStorage.setItem(LS_PLAYLIST, JSON.stringify(playlist));
  } catch {
    /* 隐私模式等场景忽略 */
  }
}

function persistVolume() {
  try {
    localStorage.setItem(LS_VOLUME, String(volume));
  } catch {
    /* ignore */
  }
}

// ── 随机（洗牌）播放 ──
// 生成一次全列表洗牌（Fisher-Yates），随机模式下按 shuffleOrder 顺序播放，
// 播完一轮重新洗牌，保证一轮内不重复、不跳过任何一首。
function buildShuffleOrder() {
  shuffleOrder = playlist.map((_, i) => i);
  for (let i = shuffleOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffleOrder[i], shuffleOrder[j]] = [shuffleOrder[j], shuffleOrder[i]];
  }
}

// 手动播放某首歌后调用：以该歌为序列起点，其余歌曲随机排在其后，
// 这样点「下一曲」会从其余歌曲里随机开始，且本轮内不重复当前歌。
function resetShuffleForManual() {
  if (mode !== "shuffle") return;
  if (playlist.length <= 1) {
    shuffleOrder = [0];
    return;
  }
  const curIdx = playlist.findIndex((s) => s.id === currentSong?.id);
  const rest = playlist.map((_, i) => i).filter((i) => i !== curIdx);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  shuffleOrder = curIdx === -1 ? rest : [curIdx, ...rest];
}

// 随机模式下取「下一首」在播放列表中的索引（必要时自动重建序列）
function shufflePickIndex(): number {
  if (playlist.length <= 1) return 0;
  if (shuffleOrder.length !== playlist.length) buildShuffleOrder();
  const curIdx = playlist.findIndex((s) => s.id === currentSong?.id);
  const pos = curIdx === -1 ? -1 : shuffleOrder.indexOf(curIdx);
  // 当前歌在序列中间 → 直接取后一位，本轮内不重复
  if (pos !== -1 && pos < shuffleOrder.length - 1) return shuffleOrder[pos + 1];
  // 当前歌是最后一个 / 不在序列中 → 重新洗牌，并保证第一首不是当前歌
  buildShuffleOrder();
  if (shuffleOrder[0] !== curIdx) return shuffleOrder[0];
  if (shuffleOrder.length > 1) {
    [shuffleOrder[0], shuffleOrder[1]] = [shuffleOrder[1], shuffleOrder[0]];
    return shuffleOrder[0];
  }
  return shuffleOrder[0];
}

async function loadAndPlay(song: SongMeta, list?: SongMeta[], manual = false) {
  if (audio) {
    audio.pause();
    audio.src = "";
    audio = null;
  }
  if (list && list.length > 0) {
    playlist = [...list];
    persistPlaylist();
  }
  loadingUrlId = song.id;
  currentSong = song;
  playing = false;
  currentTime = 0;
  duration = song.duration ?? 0;
  lyrics = [];
  error = "";
  emit();

  // 手动播放（用户点歌）时重置洗牌序列：以该歌为起点，其余歌曲随机排后
  if (manual) resetShuffleForManual();

  const [urlResult, lyricsResult] = await Promise.all([
    fetchSongUrl(song.id),
    fetchLyrics(song.id),
  ]);
  loadingUrlId = null;
  lyrics = lyricsResult;
  emit();

  if (!urlResult) {
    error = "该歌曲暂无免费音源，试试其他歌曲";
    emit();
    return;
  }

  const a = new Audio(urlResult);
  a.volume = volume;
  audio = a;
  a.play()
    .then(() => {
      playing = true;
      emit();
    })
    .catch(() => {});
  a.addEventListener("timeupdate", () => {
    currentTime = a.currentTime;
    emit();
  });
  a.addEventListener("ended", () => {
    // 单曲循环：原地重播
    if (mode === "loop" && audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }
    const target = pickNext();
    if (target) loadAndPlay(target);
    else {
      playing = false;
      currentTime = 0;
      emit();
    }
  });
  a.addEventListener("loadedmetadata", () => {
    duration = a.duration || song.duration || 0;
    emit();
  });
}

function pickNext(): SongMeta | null {
  if (!currentSong || playlist.length === 0) return null;
  if (mode === "shuffle") return playlist[shufflePickIndex()];
  const idx = playlist.findIndex((s) => s.id === currentSong!.id);
  if (idx === -1) return playlist[0];
  return playlist[(idx + 1) % playlist.length];
}

function play() {
  if (!audio) return;
  audio
    .play()
    .then(() => {
      playing = true;
      emit();
    })
    .catch(() => {});
}

function pause() {
  if (!audio) return;
  audio.pause();
  playing = false;
  emit();
}

function toggle() {
  if (playing) pause();
  else play();
}

function next() {
  if (!currentSong || playlist.length === 0) return;
  let target: SongMeta;
  if (mode === "shuffle") {
    target = playlist[shufflePickIndex()];
  } else {
    const idx = playlist.findIndex((s) => s.id === currentSong!.id);
    target = idx === -1 ? playlist[0] : playlist[(idx + 1) % playlist.length];
  }
  loadAndPlay(target);
}

function prev() {
  if (!currentSong || playlist.length === 0) return;
  let target: SongMeta;
  if (mode === "shuffle") {
    if (playlist.length <= 1) {
      target = playlist[0];
    } else {
      if (shuffleOrder.length !== playlist.length) buildShuffleOrder();
      const curIdx = playlist.findIndex((s) => s.id === currentSong!.id);
      const pos = curIdx === -1 ? -1 : shuffleOrder.indexOf(curIdx);
      if (pos === -1) {
        // 当前歌不在洗牌序列中 → 随机取一首
        target = playlist[shufflePickIndex()];
      } else {
        // 沿洗牌序列回退一位（开头的回退到末尾）
        target =
          playlist[
            shuffleOrder[(pos - 1 + shuffleOrder.length) % shuffleOrder.length]
          ];
      }
    }
  } else {
    const idx = playlist.findIndex((s) => s.id === currentSong!.id);
    target = idx === -1 ? playlist[0] : playlist[(idx - 1 + playlist.length) % playlist.length];
  }
  loadAndPlay(target);
}

function setVolume(v: number) {
  volume = v;
  if (audio) audio.volume = v;
  persistVolume();
  emit();
}

function seek(t: number) {
  if (audio) audio.currentTime = t;
  currentTime = t;
  emit();
}

function setMode(m: PlayMode) {
  mode = m;
  // 切到随机时以当前歌为起点建立洗牌序列，避免下曲仍是同一首或"有规律"
  if (m === "shuffle") resetShuffleForManual();
  emit();
}

function cycleMode() {
  const order: PlayMode[] = ["order", "shuffle", "loop"];
  mode = order[(order.indexOf(mode) + 1) % order.length];
  if (mode === "shuffle") resetShuffleForManual();
  emit();
}

/** 加入播放列表；若当前无播放歌曲则自动开播 */
function addToPlaylist(song: SongMeta) {
  if (playlist.some((s) => s.id === song.id)) return;
  playlist = [...playlist, song];
  persistPlaylist();
  emit();
  if (!currentSong) loadAndPlay(song, undefined, true);
}

/** 从播放列表移除；若移除的是当前歌曲则顺延播放下一首 */
function removeFromPlaylist(id: number) {
  const idx = playlist.findIndex((s) => s.id === id);
  if (idx === -1) return;
  const removingCurrent = currentSong?.id === id;
  playlist = playlist.filter((s) => s.id !== id);
  persistPlaylist();
  emit();
  if (removingCurrent) {
    if (playlist.length > 0) {
      if (mode === "shuffle") {
        // 随机模式下顺延随机取下一首
        loadAndPlay(playlist[shufflePickIndex()]);
      } else {
        loadAndPlay(playlist[Math.min(idx, playlist.length - 1)]);
      }
    } else {
      if (audio) {
        audio.pause();
        audio.src = "";
        audio = null;
      }
      currentSong = null;
      playing = false;
      currentTime = 0;
      duration = 0;
      lyrics = [];
      emit();
    }
  }
}

export function useMusicPlayer() {
  const state = useSyncExternalStore(subscribe, getSnapshot);

  return {
    ...state,
    play,
    pause,
    toggle,
    next,
    prev,
    setVolume,
    seek,
    setMode,
    cycleMode,
    loadAndPlay,
    addToPlaylist,
    removeFromPlaylist,
    searchSongs,
    formatTime,
  };
}
