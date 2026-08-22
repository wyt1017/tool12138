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

async function gdJson(path: string): Promise<any | null> {
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

// injahow 网易中继：type=url 会 302 到网易 CDN mp3，res.url 即最终直链
async function injahowUrl(id: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`https://api.injahow.cn/meting/?server=netease&type=url&id=${encodeURIComponent(id)}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    if (!res.ok) return "";
    const ct = res.headers.get("Content-Type") || "";
    if (ct.includes("json")) {
      const j = (await res.json()) as { url?: string };
      return j.url ? String(j.url) : "";
    }
    // 响应体是音频（跟随 302 后的 CDN 直链），取最终 URL
    return res.url || "";
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

// 跨平台音源回退（gdstudio 中继版）：用「歌名+歌手」在腾讯/酷狗/酷我/百度依次重搜，
// 返回第一个可播放的音源。国内服务器取源，不受海外出口 IP 门禁影响。
async function crossServerFallback(name: string, artist: string): Promise<string> {
  const keyword = `${name} ${artist}`.trim() || name;
  for (const srv of ["tencent", "kugou", "kuwo", "baidu"]) {
    const list = await gdJson(`?types=search&source=${srv}&name=${encodeURIComponent(keyword)}`);
    if (!Array.isArray(list)) continue;
    for (const it of list.slice(0, 3)) {
      const uid = it?.url_id ?? it?.id;
      if (uid == null) continue;
      const u = await gdJson(`?types=url&source=${srv}&id=${encodeURIComponent(String(uid))}&br=128`);
      let url = u?.url ? String(u.url) : "";
      if (!url) continue;
      url = url.replace(/^http:\/\//, "https://");
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

// 解析搜索结果，输出与其它源一致的字段供前端复用。
// 注意：InnerTube 不同客户端返回结构不同，实测——
//  - Web：contents.twoColumnSearchResultsRenderer...itemSectionRenderer[].videoRenderer
//  - ANDROID_VR：contents.sectionListRenderer[].itemSectionRenderer[].compactVideoRenderer（实测）
//  - Music 应用：contents.sectionListRenderer[].musicShelfRenderer[].musicResponsiveListItemRenderer
// 三种都解析，否则搜索结果恒为空。
function parseYtSearch(data: any): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];

  const pushItem = (v: any) => {
    const vid = v?.videoId;
    if (!vid) return;
    const title = v.title?.runs?.[0]?.text || v.title?.simpleText || "";
    if (!title) return;
    const artistRuns = v.ownerText?.runs || v.shortBylineText?.runs || [];
    out.push({
      id: vid,
      name: title,
      artist: artistRuns.map((r: any) => r.text).join(" "),
      url_id: vid,
      lyric_id: "",
      duration: v.lengthText?.simpleText || "",
      source: "youtube",
    });
  };

  // Web 结构
  const webSections =
    data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
      ?.contents || [];
  // Android / Music 结构（顶层 sectionListRenderer）
  const androidSections = data?.contents?.sectionListRenderer?.contents || [];

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
        (c: any) => c?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || []
      );
      const title = (flex[0] || []).map((r: any) => r.text).join("");
      if (!title) continue;
      out.push({
        id: vid,
        name: title,
        artist: (flex[1] || []).map((r: any) => r.text).join(" "),
        url_id: vid,
        lyric_id: "",
        duration: (flex[2] || []).map((r: any) => r.text).join(""),
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
async function ytPlayerData(vid: string): Promise<{ data: any; client: string } | null> {
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
    if (data && (data.streamingData?.adaptiveFormats || []).some((f: any) => f.url)) {
      return { data, client: c.name };
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
      { name: "injahow-netease-url", url: "https://api.injahow.cn/meting/?server=netease&type=url&id=5257138" },
      { name: "gdstudio-netease-url", url: "https://music-api.gdstudio.xyz/api.php?types=url&id=5257138&source=netease&br=128" },
      { name: "gdstudio-kuwo-search", url: "https://music-api.gdstudio.xyz/api.php?types=search&source=kuwo&name=%E5%B1%8B%E9%A1%B6" },
      { name: "gdstudio-tencent-search", url: "https://music-api.gdstudio.xyz/api.php?types=search&source=tencent&name=%E5%B1%8B%E9%A1%B6" },
      { name: "gdstudio-kugou-search", url: "https://music-api.gdstudio.xyz/api.php?types=search&source=kugou&name=%E5%B1%8B%E9%A1%B6" },
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
          const text = (await res.text()).slice(0, 500);
          return { name: t.name, status: res.status, ok: res.ok, body: text };
        } catch (e) {
          return { name: t.name, status: 0, ok: false, body: String(e) };
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
          sample: fmts.slice(0, 3).map((f: any) => ({
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
    // 官方 eapi 接口在海外 Worker 出口下常被风控返回空 → 依次走国内中继：gdstudio → injahow
    if (!url) url = await fallbackSongUrl(id);
    if (!url) url = await injahowUrl(id);
    // 仍取不到 → 用歌名+歌手经 gdstudio 在腾讯/酷狗/酷我/百度重搜（国内中继，海外可达）
    if (!url && name) url = await crossServerFallback(name, artist);
    // 最后兜底：YouTube 重搜取源（数据中心 IP 常被 PoToken 拦截，命中概率低但保留）
    if (!url && name) {
      const vid = await ytFirstVideoId(name, artist);
      if (vid) {
        url = await youtubeStreamByVid(vid);
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
