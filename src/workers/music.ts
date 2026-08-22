// 音乐 API：基于 @meting/core 走网易云 eapi 加密接口（Android 客户端 UA + 加密参数），
// 可在 Cloudflare Workers 海外出口下正常搜索 / 取音源 / 取歌词，绕过老接口的海外 IP 封锁。
// 该模块同时被 Worker（生产）与 Vite dev server（本地开发）复用，保证两环境行为一致。

import Meting from "@meting/core";
import aesjs from "aes-js";
import { createHash } from "crypto";

// url/lrc 接口的访问令牌（前端同源请求携带；防止接口被外部无谓调用）
const MUSIC_TOKEN = "same-toolbox-music-2026";

const SERVERS = ["netease", "tencent", "kugou", "baidu", "kuwo"];
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
    // 仍取不到 → 用歌名+歌手在其它平台重搜，大幅提升可播覆盖率
    if (!url && name) url = await crossServerFallback(name, artist);
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
