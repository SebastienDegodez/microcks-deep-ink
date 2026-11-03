import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Hash router + relative base: the demo is served from a sub-path of GitHub Pages
// (/demo/), which has no SPA fallback (plan decision D13).
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    setupFiles: ['src/test-setup.ts'],
  },
});
