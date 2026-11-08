/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { exampleSource } from './example-source';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    exampleSource(),
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
  // Runs every story as a test (render + play + a11y): https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
  test: {
    projects: [
      {
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
