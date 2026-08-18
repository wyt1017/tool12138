// src/workers/index.ts
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const allowedExtensions = [".js", ".css", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".woff2", ".woff", ".ttf", ".json", ".ico", ".map"];
    let response;
    for (const ext of allowedExtensions) {
      if (pathname.toLowerCase().endsWith(ext)) {
        try {
          response = await env.ASSETS.fetch(request);
          response = new Response(response.body, response);
          response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
          response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
          response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
          response.headers.set("X-Content-Type-Options", "nosniff");
          response.headers.set("X-Frame-Options", "DENY");
          response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' data: https://api.frankfurter.app https://api.github.com https://api.open-meteo.com https://geocoding-api.open-meteo.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';");
          return response;
        } catch {
        }
      }
    }
    const skipPaths = ["/@vite", "/@react-refresh", "/@id", "/@id/__x00__"];
    for (const sp of skipPaths) {
      if (pathname.startsWith(sp)) {
        const resp = new Response("Not Found", { status: 404 });
        resp.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
        resp.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        return resp;
      }
    }
    try {
      response = await env.ASSETS.fetch(request);
    } catch {
      const indexRequest = new Request(new URL("/index.html", url), request);
      response = await env.ASSETS.fetch(indexRequest);
    }
    response = new Response(response.body, response);
    response.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=86400");
    response.headers.set("Pragma", "");
    response.headers.set("Expires", "");
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' data: https://api.frankfurter.app https://api.github.com https://api.open-meteo.com https://geocoding-api.open-meteo.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';");
    if (url.protocol === "http:" && !(url.hostname === "localhost" || url.hostname === "127.0.0.1")) {
      const httpsUrl = url.origin + url.pathname + url.search + url.hash;
      return new Response("", { status: 301, headers: { Location: httpsUrl.replace("http:", "https:"), "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload" } });
    }
    return response;
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
