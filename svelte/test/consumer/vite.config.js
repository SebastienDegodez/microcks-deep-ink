import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'no-react-production-modules',
      generateBundle() {
        for (const id of this.getModuleIds()) {
          if (/(?:^|[/\\])(?:react|react-dom|react-reconciler)(?:[/\\]|$)/.test(id)) {
            this.error(`React module in consumer: ${id}`);
          }
        }
      },
    },
  ],
});
