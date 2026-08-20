import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import type { Connect, Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { HttpsProxyAgent } from 'https-proxy-agent';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const systemProxy = process.env.HTTPS_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.http_proxy;

// 与 Worker 端一致的公共 API 代理白名单
const PROXY_ALLOWED_PREFIXES = [
  'https://api.open-meteo.com/',
  'https://geocoding-api.open-meteo.com/',
  'https://api.frankfurter.app/',
  'https://api.github.com/',
];

const proxyAgent = systemProxy ? new HttpsProxyAgent(systemProxy) : undefined;

// 本地 dev 服务 /api/proxy：从 ?url= 读取目标并转发（走系统代理，规避浏览器直连失败）
function createApiProxyPlugin(): Plugin {
  return {
    name: 'same-toolbox-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/proxy', (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
        if (req.method !== 'GET') return next();
        const q = new URL(req.url || '', 'http://localhost');
        const targetUrl = q.searchParams.get('url') || '';
        if (!PROXY_ALLOWED_PREFIXES.some((p) => targetUrl.startsWith(p))) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Forbidden' }));
          return;
        }
        const t = new URL(targetUrl);
        const upstream = https.request({
          method: 'GET',
          hostname: t.hostname,
          port: t.port || 443,
          path: t.pathname + t.search,
          headers: {
            'User-Agent': 'same-toolbox/1.0 (https://same-toolbox.pages.dev)',
            'Accept': 'application/json',
          },
          agent: proxyAgent,
        }, (r) => {
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
        upstream.on('error', () => {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Proxy Error' }));
        });
        upstream.end();
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
  plugins: [
    createApiProxyPlugin(),
    react(mode === 'development' ? {
      babel: {
        plugins: ['react-dev-locator'],
      },
    } : undefined),
    tsconfigPaths()
  ],
  server: {
    allowedHosts: true,
    proxy: systemProxy ? {
      '/api/hf': {
        target: 'https://huggingface.co/api',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/hf/, ''),
        headers: { 'User-Agent': 'same-toolbox/1.0 (https://same-toolbox.pages.dev)' },
        agent: systemProxy ? new HttpsProxyAgent(systemProxy) : undefined,
      },
    } : {
      '/api/hf': {
        target: 'https://huggingface.co/api',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/hf/, ''),
        headers: { 'User-Agent': 'same-toolbox/1.0 (https://same-toolbox.pages.dev)' },
      },
    },
  },
}))
