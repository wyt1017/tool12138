export default {
  async fetch(request: Request, env: { ASSETS: { fetch: (req: Request) => Promise<Response> } }): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 允许的路径白名单：静态资源直接访问
    const allowedExtensions = ['.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.woff2', '.woff', '.ttf', '.json', '.ico', '.map'];
    let response: Response;

    // 如果请求的是静态资源文件，尝试直接返回
    for (const ext of allowedExtensions) {
      if (pathname.toLowerCase().endsWith(ext)) {
        try {
          response = await env.ASSETS.fetch(request);
          // 静态资源：长期缓存 + 安全头
          response = new Response(response.body, response);
          response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
          response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
          response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
          response.headers.set('X-Content-Type-Options', 'nosniff');
          response.headers.set('X-Frame-Options', 'DENY');
          response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'");
          return response;
        } catch {
          // fall through to SPA fallback
        }
      }
    }

    // 排除 Vite HMR 和内部路径
    const skipPaths = ['/@vite', '/@react-refresh', '/@id', '/@id/__x00__'];
    for (const sp of skipPaths) {
      if (pathname.startsWith(sp)) {
        const resp = new Response('Not Found', { status: 404 });
        resp.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        resp.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        return resp;
      }
    }

    // HTML 页面：SPA fallback
    try {
      response = await env.ASSETS.fetch(request);
    } catch {
      const indexRequest = new Request(new URL('/index.html', url), request);
      response = await env.ASSETS.fetch(indexRequest);
    }

    // HTML 响应：短期缓存 + 安全头
    response = new Response(response.body, response);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'");

    // 强制 HTTPS 重定向
    if (url.protocol === 'http:' && !(url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
      const httpsUrl = url.origin + url.pathname + url.search + url.hash;
      return new Response('', { status: 301, headers: { Location: httpsUrl.replace('http:', 'https:'), 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload' } });
    }

    return response;
  }
};
