// functions/[[path]].ts
// Cloudflare Pages SPA fallback（无 _redirects 循环风险）

const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
};

const csp =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' data: https://fonts.gstatic.com; " +
  "img-src 'self' data: blob: https:; " +
  // QR 生成器会用 fetch(qrDataUrl) 请求 data: URL，必须加 data:
  "connect-src 'self' data: https://api.frankfurter.app https://api.github.com https://api.open-meteo.com https://geocoding-api.open-meteo.com; " +
  "frame-ancestors 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self';";

export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 走到这里的“带扩展名”路径 = 缺失的静态资源 → 返回真实 404
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders },
    });
  }

  // SPA 回退：把请求改到 /index.html，再用 context.next() 交给 Pages 静态资源处理器
  url.pathname = '/index.html';
  const indexRequest = new Request(url, request);
  const response = await context.next(indexRequest);

  if (!response.ok) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders },
    });
  }

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=86400');
  Object.entries(securityHeaders).forEach(([k, v]) => headers.set(k, v));
  headers.set('Content-Security-Policy', csp);
  return new Response(response.body, { status: response.status, headers });
}
