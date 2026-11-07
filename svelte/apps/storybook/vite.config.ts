import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({ compilerOptions: { runes: undefined } }),
    {
      name: 'svelte-preview-boundary',
      generateBundle() {
        for (const id of this.getModuleIds()) {
          if (/(?:^|[/\\])(?:react|react-dom|react-reconciler)(?:[/\\]|$)/.test(id)) {
            this.error(`React runtime module in Svelte preview: ${id}`);
          }
        }
      },
    },
  ],
});
