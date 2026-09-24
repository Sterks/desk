import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// dev-режим: `desk ui` на 4717 + `npm run dev:ui`; прокси подменяет Origin, иначе сервер ответит 403.
const DESK_UI = 'http://127.0.0.1:4717';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL('../dist/ui', import.meta.url)),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: DESK_UI,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (req) => req.setHeader('origin', DESK_UI));
        },
      },
    },
  },
});
