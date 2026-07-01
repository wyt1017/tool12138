import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  },
}))
