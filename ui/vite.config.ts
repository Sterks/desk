import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({ root: fileURLToPath(new URL('.', import.meta.url)), plugins: [react()], build: { outDir: fileURLToPath(new URL('../dist/ui', import.meta.url)), emptyOutDir: true }, server: { proxy: { '/api': { target: 'http://127.0.0.1:4717', changeOrigin: true } } } });
