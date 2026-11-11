import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { searchForWorkspaceRoot } from 'vite';
import { defineConfig } from 'vitest/config';

// Hash router + relative base: the demo is served from a sub-path of GitHub Pages, which has no SPA fallback.
export default defineConfig({
  base: './',
  plugins: [
    svelte(),
    svelteTesting(),
    {
      name: 'native-svelte-demo',
      generateBundle() {
        for (const id of this.getModuleIds()) {
          if (/(?:^|[/\\])(?:react|react-dom|react-reconciler)(?:[/\\]|$)/.test(id)) {
            this.error(`React runtime in the Svelte demo: ${id}`);
          }
        }
      },
    },
  ],
  resolve: {
    alias: [{ find: '@', replacement: new URL('./src', import.meta.url).pathname }],
  },
  server: {
    // The shared demo packages (`link:` to the root workspace) live outside this workspace.
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), '../../../packages'] },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test-setup.ts'],
    testTimeout: 15_000,
  },
});
