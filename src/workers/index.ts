import { handleMusicRequest } from "./music";

/** 统一的 JSON 响应，避免 API 分支返回纯文本被误判为 HTML 页面 */
function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

/**
 * Cloudflare Workers 边缘缓存。
 * 惰性读取以保证模块顶层求值安全；caches.default 也不在 DOM 类型定义中。
 */
function getEdgeCache(): Cache {
  return (caches as unknown as { default: Cache }).default;
}

/** 按上游域分档边缘缓存 TTL（秒） */
function proxyCacheTtl(target: string): number {
  if (target.startsWith('https://api.github.com/')) return 3600;
  if (
    target.startsWith('https://api.open-meteo.com/') ||
    target.startsWith('https://geocoding-api.open-meteo.com/') ||
    target.startsWith('https://api.frankfurter.app/')
  ) {
    return 600;
  }
  return 300;
}

export default {
  async fetch(request: Request, env: { ASSETS: { fetch: (req: Request) => Promise<Response> } }): Promise<Response> {
    const url = new URL(request.url);

    // ── 0. 强制 HTTPS ──
    if (url.protocol === 'http:') {
      url.protocol = 'https:';
      return new Response(null, {
        status: 301,
        headers: {
          Location: url.toString(),
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        },
      });
    }

    const pathname = url.pathname;
    const extLower = pathname.toLowerCase();

    // 所有响应都会带上的基础安全头
    const securityHeaders = {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
    };

    // 收紧但不破坏功能：字体已自托管（/fonts/*.woff2），外部图片与工具依赖的公共 API 走 /api/proxy 同源代理
    const csp =
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "font-src 'self' data:; " +
      "img-src 'self' data: blob: https:; " +
      "connect-src 'self' data: https://api.frankfurter.app https://api.github.com https://api.open-meteo.com https://geocoding-api.open-meteo.com https://music.163.com; " +
      "media-src 'self' https:; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';";

    // ── 1. 静态资源 ──
    const staticExts = [
      '.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp',
      '.woff2', '.woff', '.ttf', '.json', '.ico', '.mp4', '.webm', '.ogv',
      '.ogg', '.mp3', '.wav', '.avi', '.mov', '.m4a', '.mkv',
    ];
    for (const ext of staticExts) {
      if (extLower.endsWith(ext)) {
        const res = await env.ASSETS.fetch(request);
        if (!res.ok) {
          return new Response('Not Found', {
            status: res.status,
            headers: { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders },
          });
        }
        const ct = res.headers.get('Content-Type') || '';
        if (ct.includes('text/html')) {
          return new Response('Not Found', {
            status: 404,
            headers: { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders },
          });
        }
        const clean = new Response(res.body, {
          status: res.status,
          statusText: res.statusText,
          headers: new Headers(res.headers),
        });
        clean.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        Object.entries(securityHeaders).forEach(([k, v]) => clean.headers.set(k, v));
        clean.headers.set('Content-Security-Policy', csp);
        return clean;
      }
    }

    // ── 2. 音乐 API（@meting/core eapi 加密请求网易云，绕过海外 IP 封锁） ──
    if (pathname === '/api/music' && request.method === 'GET') {
      return handleMusicRequest(url.searchParams);
    }

    // ── 3. 公共 API 同源代理（白名单转发，规避浏览器跨域与地区网络不可达） ──
    if (pathname === '/api/proxy' && request.method === 'GET') {
      const target = url.searchParams.get('url') || '';
      const allowedPrefixes = [
        'https://api.open-meteo.com/',
        'https://geocoding-api.open-meteo.com/',
        'https://api.frankfurter.app/',
        'https://api.github.com/',
        'https://music.163.com/',
      ];
      if (!allowedPrefixes.some((p) => target.startsWith(p))) {
        return jsonResponse(403, { error: 'Forbidden' }, securityHeaders);
      }

      // 按上游域分档 TTL：GitHub 匿名调用限流最严（60 次/小时/IP），缓存收益最高
      const ttl = proxyCacheTtl(target);
      const cacheKey = new Request(target, { method: 'GET' });
      const cache = getEdgeCache();

      const cached = await cache.match(cacheKey);
      if (cached) {
        const hit = new Response(cached.body, cached);
        hit.headers.set('X-Guaqi-Cache', 'HIT');
        return hit;
      }

      // 网易云老接口会校验 Referer/Cookie，服务器端请求需补齐浏览器上下文头
      const upstreamHeaders: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
      };
      if (target.startsWith('https://music.163.com/')) {
        upstreamHeaders['Referer'] = 'https://music.163.com/';
        upstreamHeaders['Origin'] = 'https://music.163.com';
        upstreamHeaders['Cookie'] = 'os=pc; appver=2.9.7; osver=Microsoft-Windows-10';
      }
      try {
        const res = await fetch(target, { headers: upstreamHeaders });
        const body = await res.text();
        const contentType = res.headers.get('Content-Type') || 'application/json';

        // 上游 4xx/5xx（限流 403/429、上游自身故障）在语义上不是客户端错误，
        // 归一化为 502，避免污染本站 4xx 指标并误导排查
        if (!res.ok) {
          return jsonResponse(502, { error: 'Upstream Error', upstream: res.status }, securityHeaders);
        }

        const cacheable = new Response(body, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': `public, max-age=${ttl}`,
          },
        });
        await cache.put(cacheKey, cacheable.clone());

        return new Response(body, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Cache-Control': `public, max-age=${ttl}`,
            'X-Guaqi-Cache': 'MISS',
          },
        });
      } catch {
        return jsonResponse(502, { error: 'Proxy Error' }, securityHeaders);
      }
    }

    // ── 4. 其余 /api/* 一律 404，绝不下落到 SPA fallback ──
    // 否则爬虫对不存在的 API 路径会拿到 200 + text/html，把 HTML 当成 API 结果
    if (pathname === '/api/music' || pathname === '/api/proxy') {
      return jsonResponse(405, { error: 'Method Not Allowed' }, { ...securityHeaders, Allow: 'GET' });
    }
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return jsonResponse(404, { error: 'Not Found' }, securityHeaders);
    }

    // ── 5. 排除 Vite HMR 和内部路径 ──
    if (pathname.startsWith('/@') || pathname.includes('__vite__')) {
      return new Response('', { status: 404, headers: securityHeaders });
    }

    // ── 6. SPA fallback：返回 index.html（允许短时间缓存，提升边缘命中率） ──
    // 用全新的纯 GET 请求获取 index.html（不复用入站请求的 method/body/headers，避免偶发 ASSETS 取回异常），
    // 并在网络抖动 / 部署切换瞬间自动重试，降低刷新页面时偶现 Internal Server Error。
    const indexUrl = new URL('/index.html', url);
    let indexRes: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const indexReq = new Request(indexUrl, {
          method: 'GET',
          headers: { 'Accept': 'text/html' },
        });
        indexRes = await env.ASSETS.fetch(indexReq);
        if (indexRes.ok) break;
      } catch {
        indexRes = null; // 网络/运行时抖动，重试
      }
    }
    if (!indexRes || !indexRes.ok) {
      return new Response('Internal Server Error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders },
      });
    }
    return new Response(indexRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=86400',
        ...securityHeaders,
        'Content-Security-Policy': csp,
      },
    });
  },
};
