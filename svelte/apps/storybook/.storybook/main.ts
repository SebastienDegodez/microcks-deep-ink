import type { StorybookConfig } from '@storybook/svelte-vite';
import { storySourcePlugin } from '../scripts/story-source.mjs';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/svelte-vite', options: {} },
  core: { disableTelemetry: true },
  viteFinal: async (cfg) => ({
    ...cfg,
    plugins: [...(cfg.plugins ?? []), storySourcePlugin()],
    base: process.env.SB_BASE ?? cfg.base,
    resolve: {
      ...cfg.resolve,
      dedupe: [...(cfg.resolve?.dedupe ?? []), 'svelte', 'react', 'react-dom', '@microcks/deep-ink', '@microcks-deep-ink/plugin-sdk', '@microcks-deep-ink/registry'],
    },
  }),
};
export default config;
