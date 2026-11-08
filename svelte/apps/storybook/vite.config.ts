import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({ compilerOptions: { runes: undefined } }),
    {
      name: 'svelte-preview-boundary',
      moduleParsed(info) {
        // Storybook's docs/manager use React; only our preview/library sources must be native.
        if (!/(?:\/packages\/deep-ink\/(?:src|dist)\/|\/storybook\/src\/)/.test(info.id) || info.id.includes('/node_modules/') || info.id.split('?')[0].endsWith('.mdx')) return;
        for (const id of [...info.importedIds, ...info.dynamicallyImportedIds]) {
          if (/(?:^|[/\\])(?:react|react-dom|react-reconciler)(?:[/\\]|$)/.test(id)) {
            this.error(`React runtime imported by native Svelte source ${info.id}: ${id}`);
          }
        }
      },
    },
  ],
});
