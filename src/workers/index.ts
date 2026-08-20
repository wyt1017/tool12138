interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  GITHUB_TOKEN?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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

    // 收紧但不破坏功能：允许 Google Fonts、外部图片和工具依赖的公共 API
    const csp =
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "img-src 'self' data: blob: https:; " +
      "connect-src 'self' data: https://api.frankfurter.app https://api.github.com https://api.open-meteo.com https://geocoding-api.open-meteo.com; " +
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

    // ── 2b. 公共 API 同源代理（白名单转发，规避浏览器跨域与地区网络不可达） ──
    if (pathname === '/api/proxy' && request.method === 'GET') {
      const target = url.searchParams.get('url') || '';
      const allowedPrefixes = [
        'https://api.open-meteo.com/',
        'https://geocoding-api.open-meteo.com/',
        'https://api.frankfurter.app/',
        'https://api.github.com/',
      ];
      if (!allowedPrefixes.some((p) => target.startsWith(p))) {
        return new Response('Forbidden', { status: 403, headers: securityHeaders });
      }
      const headers: Record<string, string> = {
        'User-Agent': 'same-toolbox/1.0 (https://same-toolbox.pages.dev)',
        'Accept': 'application/json',
      };
      // GitHub 带 token 可将匿名限流从 60 次/小时提升到 5000 次/小时
      if (target.startsWith('https://api.github.com/') && env.GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
      }

      try {
        const res = await fetch(target, { headers });
        const body = await res.text();
        // 成功响应分级缓存：GitHub 资料变化慢，缓存更久，减少重复回源
        const maxAge = target.startsWith('https://api.github.com/') ? 3600 : 300;
        return new Response(body, {
          status: res.status,
          headers: {
            'Content-Type': res.headers.get('Content-Type') || 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Cache-Control': res.ok ? `public, max-age=${maxAge}` : 'no-store',
          },
        });
      } catch (e) {
        // 记录失败的源，便于用 wrangler tail 定位是哪个 API 在抛错
        console.error('proxy fetch failed', target, e);
        return new Response('Proxy Error', { status: 502, headers: securityHeaders });
      }
    }

    // ── 3. 排除 Vite HMR 和内部路径 ──
    if (pathname.startsWith('/@') || pathname.includes('__vite__')) {
      return new Response('', { status: 404, headers: securityHeaders });
    }

    // ── 3. SPA fallback：返回 index.html（允许短时间缓存，提升边缘命中率） ──
    try {
      const indexRes = await env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
      if (!indexRes.ok) {
        return new Response('Internal Server Error', {
          status: 500,
          headers: { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders },
        });
      }
      return new Response(indexRes.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
          ...securityHeaders,
          'Content-Security-Policy': csp,
        },
      });
    } catch {
      return new Response('Internal Server Error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders },
      });
    }
  },
};
