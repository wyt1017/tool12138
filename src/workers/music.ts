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
    if (!data?.url) return json({ error: "no free source" }, 404);
    let url = String(data.url).replace("http://", "https://");
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
