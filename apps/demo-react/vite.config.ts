import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Hash router + relative base: the demo is served from a sub-path of GitHub Pages
// (/demo/), which has no SPA fallback (plan decision D13).
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: [
      // The design system is the @microcks/deep-ink package (a `link:` to react/packages/deep-ink, built first).
      // Pages keep importing `@/ui/components/ui/<item>`: every such import resolves to the package barrel.
      // The one real file left there (workflow-loom.tsx, for LoomHost's import.meta.glob) is imported relatively.
      { find: /^@\/ui\/components\/ui\/.*$/, replacement: '@microcks/deep-ink' },
      { find: '@', replacement: new URL('./src', import.meta.url).pathname },
    ],
    // One React: the package is linked from another workspace, which has its own node_modules.
    dedupe: ['react', 'react-dom'],
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
    // Route tests render whole pages over in-memory adapters. On a loaded machine (many agents
    // sharing 2 CPUs) they can pass 5 s; 15 s keeps them meaningful without false timeouts.
    testTimeout: 15_000,
  },
});
