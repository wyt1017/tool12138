export default {
  async fetch(request: Request, env: { ASSETS: { fetch: (req: Request) => Promise<Response> } }): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const extLower = pathname.toLowerCase();

    // ── 1. 静态资源 ──
    const staticExts = [".js", ".css", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".woff2", ".woff", ".ttf", ".json", ".ico"];
    for (const ext of staticExts) {
      if (extLower.endsWith(ext)) {
        const res = await env.ASSETS.fetch(request);
        if (!res.ok) {
          return new Response("Not Found", { status: res.status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }
        const ct = res.headers.get("Content-Type") || "";
        if (ct.includes("text/html")) {
          return new Response("Not Found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }
        const body = res.body;
        const clean = new Response(body, {
          status: res.status,
          statusText: res.statusText,
          headers: new Headers(res.headers),
        });
        clean.headers.set("Cache-Control", "public, max-age=31536000, immutable");
        clean.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
        clean.headers.set("X-Content-Type-Options", "nosniff");
        clean.headers.set("X-Frame-Options", "DENY");
        clean.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'");
        return clean;
      }
    }

    // ── 2. 排除 Vite HMR 和内部路径 ──
    if (pathname.startsWith("/@") || pathname.includes("__vite__")) {
      return new Response("", { status: 404 });
    }

    // ── 3. SEO 专用路径 ──
    if (pathname === "/robots.txt") {
      const res = await env.ASSETS.fetch(request);
      if (res.ok) {
        return new Response(res.body, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
      return new Response("User-agent: *\nAllow: /\nSitemap: https://same-toolbox.pages.dev/sitemap.xml\n", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (pathname === "/sitemap.xml") {
      const res = await env.ASSETS.fetch(request);
      if (res.ok) {
        return new Response(res.body, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
      return new Response("", { status: 404 });
    }

    // ── 4. SPA fallback：返回 index.html ──
    try {
      const indexRes = await env.ASSETS.fetch(new Request(new URL("/index.html", url), request));
      if (!indexRes.ok) {
        return new Response("Internal Server Error", { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
      const html = new Response(indexRes.body, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
        },
      });
      return html;
    } catch {
      return new Response("Internal Server Error", { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
  }
};
