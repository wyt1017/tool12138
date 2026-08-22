// 音乐 API：基于 @meting/core 走网易云 eapi 加密接口（Android 客户端 UA + 加密参数），
// 可在 Cloudflare Workers 海外出口下正常搜索 / 取音源 / 取歌词，绕过老接口的海外 IP 封锁。
// 该模块同时被 Worker（生产）与 Vite dev server（本地开发）复用，保证两环境行为一致。

import Meting from "@meting/core";
import aesjs from "aes-js";
import { createHash } from "crypto";

// url/lrc 接口的访问令牌（前端同源请求携带；防止接口被外部无谓调用）
const MUSIC_TOKEN = "same-toolbox-music-2026";

const SERVERS = ["netease", "tencent", "kugou", "baidu", "kuwo", "youtube"];
const TYPES = ["search", "song", "album", "artist", "playlist", "lrc", "url", "pic"];

// 网易云音源回退源：官方 eapi 在 Cloudflare Workers 海外出口下对音源接口风控返回空，
// 这里回退到公共网易云代理实例（其服务器从国内获取音源，返回可直连的 CDN 地址）。
const FALLBACK_URL_API = "https://music-api.gdstudio.xyz/api.php";

async function fallbackSongUrl(id: string): Promise<string> {
  const url = `${FALLBACK_URL_API}?types=url&id=${encodeURIComponent(id)}&source=netease&br=128`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0" } });
    clearTimeout(timer);
    if (!res.ok) return "";
    const j = (await res.json()) as { url?: string };
    return j.url ? String(j.url) : "";
  } catch {
    return "";
  }
}

// 给单次 Promise 加超时，避免某个上游平台无响应导致整个请求挂起
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) => {
      const t = setTimeout(() => reject(new Error("timeout")), ms);
      // unref 让超时定时器不阻塞进程退出（lib/运行时均支持）
      const anyTimer = t as any;
      if (typeof anyTimer.unref === "function") anyTimer.unref();
    }),
  ]);
}

// 跨平台音源回退：netease 官方在海外 Worker 出口下对部分歌曲（含 VIP 限制）取不到音源时，
// 用「歌名 + 歌手」在腾讯/酷狗/百度/酷我依次重搜，返回第一个可播放的音源，
// 显著提高可播歌曲覆盖率（解决「太多音乐没有音源」）。
async function crossServerFallback(name: string, artist: string): Promise<string> {
  const keyword = `${name} ${artist}`.trim() || name;
  const targets = ["tencent", "kugou", "baidu", "kuwo"];
  for (const srv of targets) {
    try {
      const m = new Meting(srv);
      m.format(true);
      const raw = await withTimeout(m.search(keyword, { type: 1, limit: 5 }), 8000);
      const list = JSON.parse(raw) as Array<{
        id: number | string;
        url_id?: number | string;
      }>;
      if (!Array.isArray(list) || list.length === 0) continue;
      for (const it of list) {
        const uid = it.url_id ?? it.id;
        if (uid == null) continue;
        try {
          const urlRaw = await withTimeout(m.url(String(uid), 128), 8000);
          const u = JSON.parse(urlRaw) as { url?: string };
          let url = u?.url ? String(u.url) : "";
          if (!url) continue;
          url = url.replace(/^http:\/\//, "https://");
          return url;
        } catch {
          continue;
        }
      }
    } catch {
      continue;
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

async function ytApi(endpoint: string, payload: Record<string, unknown>): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${YT_INNERTUBE}/${endpoint}?key=${YT_KEY}&prettyPrint=false`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
      body: JSON.stringify({ context: YT_CONTEXT, ...payload }),
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

// 从播放响应里挑出码率最高的纯音频流（webm/opus 或 mp4）；
// ANDROID_VR 直接返回已签名 URL，无需再解析 cipher。
function pickYtAudio(data: any): string {
  const fmts: Array<any> = data?.streamingData?.adaptiveFormats || [];
  let best: any = null;
  for (const f of fmts) {
    const mime = f.mimeType || "";
    if (!/^audio\/(webm|mp4|ogg)/.test(mime)) continue;
    if (!f.url) continue;
    if (!best || (f.bitrate || 0) > (best.bitrate || 0)) best = f;
  }
  return best ? String(best.url) : "";
}

// 解析搜索结果，取普通视频条目，输出与其它源一致的字段供前端复用
function parseYtSearch(data: any): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  const sections =
    data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
      ?.contents || [];
  for (const sec of sections) {
    const items = sec?.itemSectionRenderer?.contents || [];
    for (const it of items) {
      const v = it?.videoRenderer;
      if (!v || !v.videoId) continue;
      const title = v.title?.runs?.[0]?.text || "";
      if (!title) continue;
      out.push({
        id: v.videoId,
        name: title,
        artist: (v.ownerText?.runs || []).map((r: any) => r.text).join(" "),
        url_id: v.videoId,
        lyric_id: "",
        duration: v.lengthText?.simpleText || "",
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

// 用视频 id 从 YouTube 官方 InnerTube 取音频流
async function youtubeStreamByVid(vid: string): Promise<string> {
  const player = await ytApi("player", { videoId: vid });
  return pickYtAudio(player);
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

async function invidiousFetch(instance: string, path: string): Promise<any | null> {
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
async function invidiousBest(action: (instance: string) => Promise<any | null>): Promise<any | null> {
  for (const inst of INVIDIOUS_INSTANCES) {
    const out = await action(inst);
    if (out != null) return out;
  }
  return null;
}

// 从 Invidious 视频详情里挑出码率最高的纯音频流
function pickInvAudio(video: any): string {
  const fmts: Array<any> = video?.adaptiveFormats || [];
  let best: any = null;
  for (const f of fmts) {
    const mime = f.type || f.mimeType || "";
    if (!/^audio\//.test(mime)) continue;
    if (!f.url) continue;
    if (!best || (f.bitrate || 0) > (best.bitrate || 0)) best = f;
  }
  return best ? String(best.url) : "";
}

// 用视频 id 在 Invidious 镜像取流（多实例按序尝试）
// 说明：公共实例的搜索接口多被抗体验证码拦截，因此只使用其 /videos/<id> 取流接口做镜像兜底，
// 视频 id 由上方 YouTube 官方 InnerTube 搜索获得，避免走被拦截的 Invidious 搜索 API。
async function invidiousStream(vid: string): Promise<string> {
  const detail = await invidiousBest((inst) =>
    invidiousFetch(inst, `/api/v1/videos/${encodeURIComponent(vid)}?fields=adaptiveFormats,title,lengthSeconds`)
  );
  return pickInvAudio(detail);
}

// 针对 Netease provider 做两处适配：
// 1. eapi 加密：Workers 运行时 AES-ECB 不可用（createCipheriv 报 iv 为 null），用 aes-js 纯 JS 实现替换；
// 2. 搜索结果格式：默认 format 不含时长/封面，这里补全 duration / cover，供前端直接使用。
function patchNetease(meting: Meting) {
  const provider = meting.provider;
  if (!provider || provider.name !== "netease") return;
  const proto = Object.getPrototypeOf(provider);
  if (!proto.__patchedEapi) {
    proto.__patchedEapi = true;
    proto.eapiEncrypt = (req: any) => {
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
  provider.format = (t: any) => {
    const al = t.al || {};
    return {
      id: t.id,
      name: t.name,
      artist: (t.ar || []).map((a: any) => a.name),
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
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function handleMusicRequest(query: URLSearchParams): Promise<Response> {
  const server = query.get("server") || "netease";
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
    if (type === "search") {
      return json(parseYtSearch(await ytApi("search", { query: id })));
    }
    if (type === "url") {
      const streamUrl = pickYtAudio(await ytApi("player", { videoId: id }));
      if (!streamUrl) return json({ error: "no free source" }, 404);
      return json({ url: streamUrl });
    }
    if (type === "lrc") return json({ lyric: "", tlyric: "" });
    return json({ error: "unsupported" }, 400);
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

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    data = null;
  }

  if (type === "url") {
    let url = data?.url ? String(data.url) : "";
    // 官方 eapi 接口在海外 Worker 出口下常被风控返回空，先回退到公共网易云代理实例
    if (!url) url = await fallbackSongUrl(id);
    // 仍取不到 → 用歌名+歌手在其它国内平台重搜，提升可播覆盖率
    if (!url && name) url = await crossServerFallback(name, artist);
    // 国内平台均被海外地区门禁挡下 → 用歌名+歌手到 YouTube 重搜取源（海外可达）
    if (!url && name) {
      const vid = await ytFirstVideoId(name, artist);
      if (vid) {
        url = await youtubeStreamByVid(vid);
        // YouTube 官方取流失败 → 退到 Invidious 镜像（多实例）按同一视频 id 取流
        if (!url) url = await invidiousStream(vid);
      }
    }
    if (!url) return json({ error: "no free source" }, 404);
    url = url.replace(/^http:\/\//, "https://");
    if (server === "netease") {
      url = url.replace("://m7c.", "://m7.").replace("://m8c.", "://m8.");
    }
    return json({ url });
  }
  if (type === "lrc") {
    return json({ lyric: data?.lyric || "", tlyric: data?.tlyric || "" });
  }
  return json(data);
}
