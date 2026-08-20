import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import path from 'path';
import { fileURLToPath } from 'url';
import { HttpsProxyAgent } from 'https-proxy-agent';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const systemProxy = process.env.HTTPS_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.http_proxy;

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
