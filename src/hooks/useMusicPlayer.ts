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
// 音乐 API 访问令牌（与 Worker 端一致，url/lrc 接口校验用）
const MUSIC_TOKEN = "same-toolbox-music-2026";

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

// 音乐 API 请求：开发环境走 Vite 中间件，生产环境走 Worker /api/music，
// 统一使用 @meting/core 的网易云 eapi 加密请求（Android 客户端 UA），规避海外 IP 封锁与跨域。
async function musicFetch(params: Record<string, string>): Promise<Response> {
  const qs = new URLSearchParams(params);
  return fetch(`/api/music?${qs.toString()}`);
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
  try {
    const res = await musicFetch({ server: "netease", type: "search", id: keyword, limit: "10" });
    const json = (await res.json()) as Array<{
      id: number;
      name: string;
      artist?: string[];
      duration?: number;
      cover?: string;
    }>;
    if (!Array.isArray(json)) return [];
    return json.map((s) => ({
      id: s.id,
      name: s.name,
      artists: (s.artist ?? []).join(", "),
      duration: s.duration && s.duration > 0 ? s.duration : undefined,
      cover: s.cover || undefined,
    }));
  } catch {
    return [];
  }
}

async function fetchSongUrl(id: number): Promise<string | null> {
  try {
    const res = await musicFetch({ server: "netease", type: "url", id: String(id), token: MUSIC_TOKEN });
    const json = (await res.json()) as { url?: string };
    return json.url ? String(json.url) : null;
  } catch {
    return null;
  }
}

async function fetchLyrics(id: number): Promise<LyricLine[]> {
  try {
    const res = await musicFetch({ server: "netease", type: "lrc", id: String(id), token: MUSIC_TOKEN });
    const json = (await res.json()) as { lyric?: string };
    return parseLyric(json.lyric ?? "");
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
