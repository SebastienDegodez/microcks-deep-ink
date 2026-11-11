import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  plugins: [
    svelte(),
    svelteTesting(),
    {
      name: 'native-svelte-demo',
      generateBundle() {
        for (const id of this.getModuleIds()) {
          if (
            /(?:^|[/\\])(?:react|react-dom|react-reconciler)(?:[/\\]|$)/.test(
              id,
            )
          ) {
            this.error(`React runtime in the Svelte demo: ${id}`);
          }
        }
      },
    },
  ],
  test: { environment: 'jsdom', setupFiles: ['src/test-setup.ts'] },
});
