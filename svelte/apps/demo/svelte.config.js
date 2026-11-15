import { fileURLToPath } from 'node:url';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const demoSources = fileURLToPath(new URL('./src/', import.meta.url));

export default {
  preprocess: vitePreprocess(),
  vitePlugin: {
    // Svelte merges adjacent text and expressions into one text node, the reference demo keeps one text node per
    // run, and Chrome lays each text node out on its own subpixel grid. An empty `<!---->` comment between two runs
    // reproduces the reference boundaries, so the demo's own components keep their comments; deep-ink is untouched.
    dynamicCompileOptions({ filename }) {
      if (filename.startsWith(demoSources)) return { preserveComments: true };
    },
  },
};
