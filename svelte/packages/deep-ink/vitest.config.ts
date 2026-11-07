import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

// Two projects: `dom` (jsdom, Testing Library, axe) for the component specs, and `ssr` (node, svelte/server) for
// the *.ssr.test.ts files such as the React parity check, whose components must be compiled for the server.
export default defineConfig({
  test: {
    css: false,
    restoreMocks: true,
    projects: [
      {
        plugins: [svelte(), svelteTesting({ autoCleanup: false })],
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.spec.ts', 'test/**/*.test.ts'],
          exclude: ['**/*.ssr.test.ts'],
          setupFiles: ['test/setup.ts'],
        },
      },
      {
        plugins: [svelte()],
        test: {
          name: 'ssr',
          environment: 'node',
          include: ['src/**/*.ssr.test.ts', 'test/**/*.ssr.test.ts'],
        },
      },
    ],
  },
});
