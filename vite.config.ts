import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import type { Connect, Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 可代理的目标域名白名单
const PROXY_ALLOWED_HOSTS = [
  'api.open-meteo.com',
  'geocoding-api.open-meteo.com',
  'api.frankfurter.app',
  'api.github.com',
  'huggingface.co',
  'music.163.com',
];

function createApiProxyPlugin(): Plugin {
  return {
    name: 'same-toolbox-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/proxy', (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
        if (req.method !== 'GET') return next();
        const q = new URL(req.url || '', 'http://localhost');
        const targetUrl = q.searchParams.get('url') || '';
        const t = new URL(targetUrl);
        if (!PROXY_ALLOWED_HOSTS.includes(t.hostname)) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Forbidden' }));
          return;
        }
        const isHttps = t.protocol === 'https:';
        const mod = isHttps ? https : http;
        const forwardHeaders: Record<string, string> = {};
        for (const [k, v] of Object.entries(req.headers)) {
          if (k !== 'host') forwardHeaders[k] = v as string;
        }
        const opts: https.RequestOptions = {
          method: req.method,
          hostname: t.hostname,
          servername: t.hostname,
          port: t.port || (isHttps ? 443 : 80),
          path: t.pathname + t.search,
          headers: {
            ...forwardHeaders,
            host: t.host,
            'accept-encoding': 'identity',
            'User-Agent': 'same-toolbox/1.0 (https://same-toolbox.pages.dev)',
          },
        };
        const upstream = mod.request(opts, (r) => {
          const chunks: Buffer[] = [];
          r.on('data', (c) => chunks.push(c));
          r.on('end', () => {
            res.statusCode = r.statusCode || 502;
            res.setHeader('Content-Type', r.headers['content-type'] || 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', (r.statusCode || 0) < 400 ? 'public, max-age=300' : 'no-store');
            res.end(Buffer.concat(chunks));
          });
        });
        upstream.on('error', (e) => {
          console.error('upstream error:', e.message);
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Proxy Error: ' + e.message }));
        });
        // Pipe request body
        req.pipe(upstream);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
        },
      },
    },
  },
  cacheDir: path.resolve(__dirname, '.vite-cache-same'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [createApiProxyPlugin(), react(mode === 'development' ? {
    babel: { plugins: ['react-dev-locator'] },
  } : undefined), tsconfigPaths()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api/hf': {
        target: 'https://huggingface.co/api',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/hf/, ''),
        headers: { 'User-Agent': 'same-toolbox/1.0 (https://same-toolbox.pages.dev)' },
      },
    },
  },
}))
