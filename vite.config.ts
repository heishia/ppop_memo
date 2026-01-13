import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'apps/desktop/renderer',
  base: './',
  build: {
    outDir: '../../../dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/desktop/renderer/src'),
      '@packages': path.resolve(__dirname, './packages'),
    },
  },
  optimizeDeps: {
    exclude: ['@myscript/iink'],
  },
  ssr: {
    noExternal: [],
    external: ['@myscript/iink'],
  },
  server: {
    port: 3000,
  },
});
