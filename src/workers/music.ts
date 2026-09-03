// 音乐 API：基于 @meting/core 走网易云 eapi 加密接口（Android 客户端 UA + 加密参数），
// 可在 Cloudflare Workers 海外出口下正常搜索 / 取音源 / 取歌词，绕过老接口的海外 IP 封锁。
// 该模块同时被 Worker（生产）与 Vite dev server（本地开发）复用，保证两环境行为一致。

import Meting from "@meting/core";
import aesjs from "aes-js";
import { createHash } from "crypto";

// ── 外部接口 JSON 的类型（替代 any，满足 eslint no-explicit-any） ──
// 网易云 / gdstudio / injahow / InnerTube / Invidious 等未建模 JSON：
// 以 Json（任意键 → unknown）为边界，深层访问时按需收窄为下方具名结构。
type Json = Record<string, unknown>;

// YouTube 搜索结果（InnerTube 三种客户端结构通用）
interface TextRun {
  text?: string;
}
interface TextBlock {
  runs?: TextRun[];
  simpleText?: string;
}
interface VideoRenderer {
  videoId?: string;
  title?: TextBlock;
  ownerText?: { runs?: TextRun[] };
  shortBylineText?: { runs?: TextRun[] };
  lengthText?: { simpleText?: string };
}
interface MusicResponsiveListItem {
  playlistItemData?: { videoId?: string };
  flexColumns?: Array<{
    musicResponsiveListItemFlexColumnRenderer?: { text?: TextBlock };
  }>;
}
interface SearchSection {
  itemSectionRenderer?: {
    contents?: Array<{ videoRenderer?: VideoRenderer; compactVideoRenderer?: VideoRenderer }>;
  };
  musicShelfRenderer?: {
    contents?: Array<{ musicResponsiveListItemRenderer?: MusicResponsiveListItem }>;
  };
}
interface SearchContents {
  twoColumnSearchResultsRenderer?: {
    primaryContents?: { sectionListRenderer?: { contents?: SearchSection[] } };
  };
  sectionListRenderer?: { contents?: SearchSection[] };
}

// 音频流 / 播放响应（InnerTube player + Invidious 共用字段）
interface AudioFormat {
  url?: string;
  mimeType?: string;
  type?: string;
  bitrate?: number;
  itag?: number;
}
interface StreamingData {
  adaptiveFormats?: AudioFormat[];
}
interface PlayerResponse {
  streamingData?: StreamingData;
  playabilityStatus?: { status?: string; reason?: string };
}
interface InvidiousVideo {
  adaptiveFormats?: AudioFormat[];
}

// 网易云 eapi 加密所需的最小结构
interface EapiRequest {
  url: string;
  body: unknown;
}
interface NeteaseSong {
  id: string | number;
  name?: string;
  al?: { name?: string; picUrl?: string };
  ar?: Array<{ name?: string }>;
  dt?: number;
}

// url/lrc 接口的访问令牌（前端同源请求携带；防止接口被外部无谓调用）
const MUSIC_TOKEN = "same-toolbox-music-2026";

// ── 音源短缓存 ──
// 背景：播放器自动切歌 + 用户切歌会产生大量 /api/music?type=url 请求，取源链路较慢且失败率高，
// 这部分重复请求既拖慢体验又造成大量 4xx/无效上游调用。这里给「最终直链」加一个极短 TTL
// 的内存缓存，显著降低重复取源与 4xx 峰值。
// 正确性关键点（为避免引入新失误，刻意保持最简单的「值+TTL」模型）：
//  - 只缓存取源成功的结果（非空 url）；取源失败不写入，下次请求仍可重试；
//  - 内存缓存仅存在于单个 Worker 实例，无跨区一致性问题，TTL 很短、会自动过期并清理；
//  - 不引入 Promise/并发的去重逻辑：同一 key 并发时均可命中或被覆盖，最坏也只是重复打一次
//    上游，行为和缓存前完全一致，绝不引入新 Bug。
const URL_CACHE_TTL_MS = 30_000;
const urlCache = new Map<string, { url: string; expires: number }>();

function getCachedUrl(key: string): string | undefined {
  const item = urlCache.get(key);
  if (!item) return undefined;
  if (item.expires <= Date.now()) {
    urlCache.delete(key);
    return undefined;
  }
  return item.url;
}

function setCachedUrl(key: string, url: string) {
  urlCache.set(key, { url, expires: Date.now() + URL_CACHE_TTL_MS });
}

function urlCacheKey(server: string, id: string): string {
  return `${server}:${id}`;
}

const SERVERS = ["netease", "tencent", "kugou", "baidu", "kuwo", "youtube"];
const TYPES = ["search", "song", "album", "artist", "playlist", "lrc", "url", "pic"];

// 网易云音源回退源：官方 eapi 在 Cloudflare Workers 海外出口下对音源接口风控返回空，
// 这里回退到 gdstudio 公共中继（其服务器从国内获取音源，返回可直连的 CDN 地址）。
async function fallbackSongUrl(id: string): Promise<string> {
  const j = await gdJson(`?types=url&id=${encodeURIComponent(id)}&source=netease&br=128`);
  return j?.url ? String(j.url) : "";
}

// ── 国内中转型接口（实测 2026-08：数据中心 IP 下唯一可行的海外路线） ──
// YouTube/Piped/Invidious/Cobalt 均对 Cloudflare Worker 出口 IP 封锁（PoToken/403/宕机），
// 而 gdstudio / injahow 由国内服务器取源、返回海外可直连的 CDN 地址，实测可用。

// gdstudio 多源中继：支持 netease/tencent/kugou/kuwo/baidu 搜索与取直链
const GDSTUDIO = "https://music-api.gdstudio.xyz/api.php";

async function gdJson(path: string): Promise<Json | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${GDSTUDIO}${path}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// injahow 网易中继：type=url 对普通歌曲 302 到网易 CDN（取 Location 直链）；
// 少量歌曲直接 200 返回音频字节（此时把端点本身作为代理播放地址返回）。
async function injahowUrl(id: string): Promise<string> {
  const endpoint = `https://api.injahow.cn/meting/?server=netease&type=url&id=${encodeURIComponent(id)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(endpoint, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: ctrl.signal,
      redirect: "manual",
    });
    // 302 → 直接用 CDN 直链
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("Location");
      return loc ? String(loc) : "";
    }
    if (!res.ok) return "";
    const ct = res.headers.get("Content-Type") || "";
    if (ct.includes("json")) {
      const j = (await res.json()) as { url?: string };
      return j.url ? String(j.url) : "";
    }
    // 200 且直接返回音频 → 端点即代理播放地址
    if (/^audio\/|octet-stream/.test(ct)) return endpoint;
    return "";
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

// 酷我官方 antiserver 取直链（实测 2026-08：海外 Worker 出口可达）。
// 陷阱：受限曲目会返回统一的 ~180KB 试听片段（非完整歌曲，播放出来是十几秒杂曲），
// 因此取到直链后必须校验 Content-Length，小于阈值视为无效，由调用方继续尝试下一候选。
async function kuwoDirectUrl(rid: string | number): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(
      `http://antiserver.kuwo.cn/anti.s?type=convert_url&rid=MUSIC_${rid}&format=mp3&response=url`,
      { headers: { "User-Agent": "Mozilla/5.0" }, signal: ctrl.signal }
    );
    if (!res.ok) return "";
    const text = (await res.text()).trim();
    if (!/^https?:\/\//.test(text)) return "";
    const url = text.replace(/^http:\/\//, "https://");
    // 校验资源完整性：HEAD 看 Content-Length（试听片段 ~180KB；完整歌 128kbps 下 ≥1MB）
    const head = await fetch(url, { method: "HEAD", signal: ctrl.signal });
    const len = Number(head.headers.get("Content-Length") || 0);
    if (!head.ok || len < 600_000) return "";
    return url;
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

// 跨平台音源回退（国内中继版）：用「歌名+歌手」重搜取直链。
// 实测 gdstudio 仅支持 netease / kuwo 两个源（tencent/kugou 返回 source not supported），
// 酷我版权库大，作为网易缺源时的补充效果最好。
async function crossServerFallback(name: string, artist: string, trace?: string[]): Promise<string> {
  const keyword = `${name} ${artist}`.trim() || name;
  for (const srv of ["kuwo"]) {
    const list = await gdJson(`?types=search&source=${srv}&name=${encodeURIComponent(keyword)}`);
    if (!Array.isArray(list)) {
      trace?.push(`${srv}: search-fail`);
      continue;
    }
    trace?.push(`${srv}: search-${list.length}`);
    for (const it of list.slice(0, 5)) {
      const uid = it?.url_id ?? it?.id;
      if (uid == null) continue;
      const url = await kuwoDirectUrl(uid);
      if (!url) {
        trace?.push(`url-${uid}: empty`);
        continue;
      }
      return url;
    }
  }
  return "";
}

// ── 海外可用音源：YouTube Music / InnerTube（ANDROID_VR 客户端） ──
// 国内平台对海外 Cloudflare Worker 的取音源接口做了地区门禁（搜索开放、取源返回空）。
// YouTube 全球可达、无需 API Key / Cookie / JS 签名解密，可作为稳定的兜底音源，
// 正好解决「太多音乐没有音源」「有源却不播放」（Worker 拿不到 URL）这两个问题。
const YT_INNERTUBE = "https://www.youtube.com/youtubei/v1";
const YT_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const YT_CONTEXT = { client: { clientName: "ANDROID_VR", clientVersion: "1.24.60" } };

// 调试开关：debug=1 时 ytApi 把上游错误状态带出来，便于排查 Worker 内调 InnerTube 失败的原因
let YT_DEBUG = false;

async function ytApi(endpoint: string, payload: Record<string, unknown>): Promise<Json | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${YT_INNERTUBE}/${endpoint}?key=${YT_KEY}&prettyPrint=false`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
      body: JSON.stringify({ context: YT_CONTEXT, ...payload }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      if (YT_DEBUG) {
        const text = await res.text();
        return { __dbg: { endpoint, status: res.status, body: text.slice(0, 300) } };
      }
      return null;
    }
    return await res.json();
  } catch (e) {
    if (YT_DEBUG) return { __dbg: { endpoint, error: String(e) } };
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// 从播放响应里挑出码率最高的纯音频流（webm/opus 或 mp4）；
// ANDROID_VR 直接返回已签名 URL，无需再解析 cipher。
function pickYtAudio(data: PlayerResponse): string {
  const fmts = data.streamingData?.adaptiveFormats || [];
  let best: AudioFormat | null = null;
  for (const f of fmts) {
    const mime = f.mimeType || "";
    if (!/^audio\/(webm|mp4|ogg)/.test(mime)) continue;
    if (!f.url) continue;
    if (!best || (f.bitrate || 0) > (best.bitrate || 0)) best = f;
  }
  return best ? best.url || "" : "";
}

// 解析搜索结果，输出与其它源一致的字段供前端复用。
// 注意：InnerTube 不同客户端返回结构不同，实测——
//  - Web：contents.twoColumnSearchResultsRenderer...itemSectionRenderer[].videoRenderer
//  - ANDROID_VR：contents.sectionListRenderer[].itemSectionRenderer[].compactVideoRenderer（实测）
//  - Music 应用：contents.sectionListRenderer[].musicShelfRenderer[].musicResponsiveListItemRenderer
// 三种都解析，否则搜索结果恒为空。
function parseYtSearch(data: Json | null): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];

  const pushItem = (v?: VideoRenderer) => {
    const vid = v?.videoId;
    if (!vid) return;
    const title = v.title?.runs?.[0]?.text || v.title?.simpleText || "";
    if (!title) return;
    const artistRuns = v.ownerText?.runs || v.shortBylineText?.runs || [];
    out.push({
      id: vid,
      name: title,
      artist: artistRuns.map((r) => r.text).join(" "),
      url_id: vid,
      lyric_id: "",
      duration: v.lengthText?.simpleText || "",
      source: "youtube",
    });
  };

  const contents = data?.contents as SearchContents | undefined;
  // Web 结构
  const webSections =
    contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
      ?.contents || [];
  // Android / Music 结构（顶层 sectionListRenderer）
  const androidSections = contents?.sectionListRenderer?.contents || [];

  for (const sec of [...webSections, ...androidSections]) {
    // 普通/紧凑视频条目
    for (const it of sec?.itemSectionRenderer?.contents || []) {
      pushItem(it?.videoRenderer || it?.compactVideoRenderer);
    }
    // Music 应用条目
    for (const it of sec?.musicShelfRenderer?.contents || []) {
      const m = it?.musicResponsiveListItemRenderer;
      const vid = m?.playlistItemData?.videoId;
      if (!m || !vid) continue;
      const flex = (m.flexColumns || []).map(
        (c) => c?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || []
      );
      const title = (flex[0] || []).map((r) => r.text).join("");
      if (!title) continue;
      out.push({
        id: vid,
        name: title,
        artist: (flex[1] || []).map((r) => r.text).join(" "),
        url_id: vid,
        lyric_id: "",
        duration: (flex[2] || []).map((r) => r.text).join(""),
        source: "youtube",
      });
    }
  }

  return out;
}

// 用「歌名+歌手」在 YouTube 官方 InnerTube 重搜，返回第一个视频 id（无验证码）
async function ytFirstVideoId(name: string, artist: string): Promise<string> {
  const keyword = `${name} ${artist}`.trim() || name;
  const data = await ytApi("search", { query: keyword });
  const list = parseYtSearch(data);
  return list.length ? String(list[0].id) : "";
}

// 用视频 id 从 YouTube 官方 InnerTube 取音频流。
// 注意：数据中心 IP（Cloudflare Worker 出口）会被 YouTube 要求 PoToken 校验
// （实测 ANDROID_VR player 返回 LOGIN_REQUIRED "Sign in to confirm you're not a bot"），
// 因此按序轮试多个客户端：嵌入式 TV 客户端（可绕过 bot 校验）→ ANDROID_VR → ANDROID。
async function ytPlayerData(vid: string): Promise<{ data: PlayerResponse; client: string } | null> {
  const clients: Array<{ name: string; version: string; embed?: boolean; sdk?: number }> = [
    { name: "TVHTML5_SIMPLY_EMBEDDED_PLAYER", version: "2.0", embed: true },
    { name: "ANDROID_VR", version: "1.24.60" },
    { name: "ANDROID", version: "19.09.37", sdk: 30 },
  ];
  for (const c of clients) {
    const client: Record<string, unknown> = { clientName: c.name, clientVersion: c.version };
    if (c.sdk) client.androidSdkVersion = c.sdk;
    const context: Record<string, unknown> = { client };
    if (c.embed) context.thirdParty = { embedUrl: "https://www.google.com" };
    const data = await ytApi("player", {
      context,
      videoId: vid,
      contentCheckOk: true,
      racyCheckOk: true,
    });
    const resp = data as PlayerResponse | null;
    if (resp && (resp.streamingData?.adaptiveFormats || []).some((f) => f.url)) {
      return { data: resp, client: c.name };
    }
  }
  return null;
}

async function youtubeStreamByVid(vid: string): Promise<string> {
  const r = await ytPlayerData(vid);
  return r ? pickYtAudio(r.data) : "";
}

// ── 海外兜底音源 2：Invidious（YouTube 开源镜像，多实例自动切换） ──
// 当 YouTube 官方 InnerTube 被风控/变更时，退到 Invidious 公共镜像取同一批音频流，
// 与官方接口互为冗余，显著提高海外取源成功率。
const INVIDIOUS_INSTANCES = [
  "https://yewtu.be",
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://inv.tux.pizza",
];

async function invidiousFetch(instance: string, path: string): Promise<Json | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${instance}${path}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// 在多个镜像实例间按序尝试，命中第一个可用的即返回；全部失败返回 null
async function invidiousBest(action: (instance: string) => Promise<Json | null>): Promise<Json | null> {
  for (const inst of INVIDIOUS_INSTANCES) {
    const out = await action(inst);
    if (out != null) return out;
  }
  return null;
}

// 从 Invidious 视频详情里挑出码率最高的纯音频流
function pickInvAudio(video: InvidiousVideo | null): string {
  const fmts = video?.adaptiveFormats || [];
  let best: AudioFormat | null = null;
  for (const f of fmts) {
    const mime = f.type || f.mimeType || "";
    if (!/^audio\//.test(mime)) continue;
    if (!f.url) continue;
    if (!best || (f.bitrate || 0) > (best.bitrate || 0)) best = f;
  }
  return best ? best.url || "" : "";
}

// 用视频 id 在 Invidious 镜像取流（多实例按序尝试）
// 说明：公共实例的搜索接口多被抗体验证码拦截，因此只使用其 /videos/<id> 取流接口做镜像兜底，
// 视频 id 由上方 YouTube 官方 InnerTube 搜索获得，避免走被拦截的 Invidious 搜索 API。
async function invidiousStream(vid: string): Promise<string> {
  const detail = await invidiousBest((inst) =>
    invidiousFetch(inst, `/api/v1/videos/${encodeURIComponent(vid)}?fields=adaptiveFormats,title,lengthSeconds`)
  );
  return pickInvAudio(detail as InvidiousVideo | null);
}

// 针对 Netease provider 做两处适配：
// 1. eapi 加密：Workers 运行时 AES-ECB 不可用（createCipheriv 报 iv 为 null），用 aes-js 纯 JS 实现替换；
// 2. 搜索结果格式：默认 format 不含时长/封面，这里补全 duration / cover，供前端直接使用。
function patchNetease(meting: Meting) {
  const provider = meting.provider;
  if (!provider || provider.name !== "netease") return;
  const proto = Object.getPrototypeOf(provider) as {
    __patchedEapi?: boolean;
    eapiEncrypt?: (req: EapiRequest) => EapiRequest;
  };
  if (!proto.__patchedEapi) {
    proto.__patchedEapi = true;
    proto.eapiEncrypt = (req: EapiRequest): EapiRequest => {
      const bodyStr = JSON.stringify(req.body);
      const path = req.url.replace(/https?:\/\/[^/]+/, "");
      const sign = createHash("md5")
        .update(`nobody${path}use${bodyStr}md5forencrypt`)
        .digest("hex");
      const payload = `${path}-36cd479b6b5-${bodyStr}-36cd479b6b5-${sign}`;
      const key = Buffer.from("e82ckenh8dichen8", "utf8");
      const padded = aesjs.padding.pkcs7.pad(Buffer.from(payload, "utf8"));
      const encrypted = new aesjs.ModeOfOperation.ecb(key).encrypt(padded);
      req.url = req.url.replace("/api/", "/eapi/").replace("http://", "https://");
      req.body = { params: Buffer.from(encrypted).toString("hex").toUpperCase() };
      return req;
    };
  }
  provider.format = (t: NeteaseSong) => {
    const al = t.al || {};
    return {
      id: t.id,
      name: t.name,
      artist: (t.ar || []).map((a) => a.name),
      album: al.name || "",
      url_id: t.id,
      lyric_id: t.id,
      duration: t.dt ? Math.round(t.dt / 1000) : 0,
      cover: al.picUrl ? al.picUrl.replace(/^http:\/\//, "https://") : "",
      source: "netease",
    };
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // 仅缓存成功响应；错误响应禁缓存，避免「修复后 5 分钟内仍返回旧错误」
      "Cache-Control": status === 200 ? "public, max-age=300" : "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function handleMusicRequest(query: URLSearchParams): Promise<Response> {
  const server = query.get("server") || "netease";

  // 版本探针：用于排查「部署成功但线上行为像旧代码」的问题
  if (server === "__ping") return json({ ok: true, build: "v20260822b" });

  // 可用性探测：从 Worker 真实运行环境批量测试候选音源接口，返回状态矩阵（诊断用）
  if (server === "__probe") {
    const targets: Array<{ name: string; url: string; init?: RequestInit }> = [
      { name: "mp3-228908-head", url: "https://kw-bj.kuwo.cn/9548e802db1737ba23e116a14d15e874/6a89841d/nf/resource/n1/69/32/588957081.mp3", init: { method: "HEAD" } },
      { name: "antiserver-109852", url: "http://antiserver.kuwo.cn/anti.s?type=convert_url&rid=MUSIC_109852&format=mp3&response=url" },
    ];
    const results = await Promise.all(
      targets.map(async (t) => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 10000);
        try {
          const res = await fetch(t.url, {
            ...t.init,
            headers: { "User-Agent": "Mozilla/5.0", ...(t.init?.headers || {}) },
            signal: ctrl.signal,
          });
          const text = (await res.text()).slice(0, 300);
          return {
            name: t.name,
            status: res.status,
            ct: res.headers.get("Content-Type"),
            cl: res.headers.get("Content-Length"),
            body: text,
          };
        } catch (e) {
          return { name: t.name, status: 0, ct: null, cl: null, body: String(e) };
        } finally {
          clearTimeout(timer);
        }
      })
    );
    return json(results);
  }

  const type = query.get("type") || "search";
  const id = (query.get("id") || "").trim();
  // 跨平台音源回退需要歌名/歌手做「以歌搜歌」
  const name = (query.get("name") || "").trim();
  const artist = (query.get("artist") || "").trim();

  if (!SERVERS.includes(server)) return json({ error: "invalid server" }, 400);
  if (!TYPES.includes(type)) return json({ error: "invalid type" }, 400);
  if (!id) return json({ error: "missing id" }, 400);

  // 音源 / 歌词接口需携带令牌，避免被外部无谓调用
  if (type === "url" || type === "lrc") {
    if (query.get("token") !== MUSIC_TOKEN) return json({ error: "unauthorized" }, 401);
  }

  // YouTube 内置源直接走 InnerTube，不经过 @meting/core
  if (server === "youtube") {
    YT_DEBUG = query.get("debug") === "1";
    if (type === "search") {
      const data = await ytApi("search", { query: id });
      if (YT_DEBUG && data?.__dbg) return json(data.__dbg);
      const list = parseYtSearch(data);
      if (YT_DEBUG) {
        return json({ dbg: list.length ? "ok" : "empty parse", sample: JSON.stringify(data?.contents).slice(0, 400) });
      }
      return json(list);
    }
    if (type === "url") {
      const r = await ytPlayerData(id);
      if (YT_DEBUG) {
        const fmts = r?.data?.streamingData?.adaptiveFormats || [];
        return json({
          dbg: "player",
          hitClient: r?.client || null,
          playability: r?.data?.playabilityStatus?.status,
          reason: r?.data?.playabilityStatus?.reason,
          formatCount: fmts.length,
          sample: fmts.slice(0, 3).map((f) => ({
            itag: f.itag,
            mime: f.mimeType,
            hasUrl: !!f.url,
          })),
        });
      }
      const streamUrl = r ? pickYtAudio(r.data) : "";
      if (!streamUrl) return json({ error: "no free source" }, 404);
      return json({ url: streamUrl });
    }
    if (type === "lrc") return json({ lyric: "", tlyric: "" });
    return json({ error: "unsupported" }, 400);
  }

  // 取源结果短缓存：命中直接返回（跳过整条上游链路），显著降低重复取源与 4xx 峰值。
  // 仅 type=url 且非 debug 模式命中；cache key 带上 name/artist，避免不同歌曲信息取到同一结果。
  if (type === "url" && query.get("debug") !== "1") {
    const cached = getCachedUrl(urlCacheKey(server, `${id}:${name}:${artist}`));
    if (cached !== undefined) return json({ url: cached });
  }

  const meting = new Meting(server);
  patchNetease(meting);
  meting.format(true);

  let raw: string;
  try {
    switch (type) {
      case "search":
        raw = await meting.search(id, { type: 1, limit: Number(query.get("limit") || 10) });
        break;
      case "song":
        raw = await meting.song(id);
        break;
      case "album":
        raw = await meting.album(id);
        break;
      case "artist":
        raw = await meting.artist(id);
        break;
      case "playlist":
        raw = await meting.playlist(id);
        break;
      case "url":
        raw = await meting.url(id, 128);
        break;
      case "lrc":
        raw = await meting.lyric(id);
        break;
      case "pic": {
        const p = JSON.parse(await meting.pic(id, 300)) as { url?: string };
        return json({ url: p.url || "" });
      }
      default:
        return json({ error: "unsupported" }, 400);
    }
  } catch (e) {
    return json({ error: "upstream error", detail: String(e) }, 502);
  }

  let data: Record<string, unknown> | null;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    data = null;
  }

  if (type === "url") {
    const dbg: Record<string, unknown> = { eapi: data?.url ? String(data.url) : "" };
    let url = data?.url ? String(data.url) : "";
    // 官方 eapi 接口在海外 Worker 出口下常被风控返回空 → 依次走国内中继：gdstudio → injahow
    if (!url) url = await fallbackSongUrl(id);
    dbg.gdstudio = url ? "hit" : "miss";
    if (!url) url = await injahowUrl(id);
    dbg.injahow = url ? "hit" : "miss";
    // 仍取不到 → 用歌名+歌手经 gdstudio 在酷我重搜（国内中继，海外可达）
    const kuwoTrace: string[] = [];
    if (!url && name) url = await crossServerFallback(name, artist, kuwoTrace);
    dbg.kuwo = kuwoTrace.join(" | ") || (url ? "hit" : "skip");
    // 最后兜底：YouTube 重搜取源（数据中心 IP 常被 PoToken 拦截，命中概率低但保留）
    if (!url && name) {
      const vid = await ytFirstVideoId(name, artist);
      if (vid) {
        url = await youtubeStreamByVid(vid);
        if (!url) url = await invidiousStream(vid);
      }
    }
    if (query.get("debug") === "1") return json({ ...dbg, final: url ? "ok" : "empty" });
    if (!url) return json({ url: "" });
    url = url.replace(/^http:\/\//, "https://");
    if (server === "netease") {
      url = url.replace("://m7c.", "://m7.").replace("://m8c.", "://m8.");
    }
    // 仅缓存取源成功的结果（非空 url），供后续同曲目短时间直接命中，降低重复请求
    setCachedUrl(urlCacheKey(server, `${id}:${name}:${artist}`), url);
    return json({ url });
  }
  if (type === "lrc") {
    return json({ lyric: data?.lyric || "", tlyric: data?.tlyric || "" });
  }
  return json(data);
}
