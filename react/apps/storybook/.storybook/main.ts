import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  // Published under GitHub Pages /react/ next to the Angular Storybook.
  viteFinal: async (cfg) => ({
    ...cfg,
    base: process.env.SB_BASE ?? cfg.base,
    resolve: {
      ...cfg.resolve,
      // One copy of each: the package is a workspace link, and apps/shared (fixtures, demo plugin, a11y docs)
      // lives in the root workspace, whose node_modules may not be installed. Resolve them all from this app.
      dedupe: [...(cfg.resolve?.dedupe ?? []), 'react', 'react-dom', '@microcks/deep-ink', '@microcks-deep-ink/plugin-sdk', '@microcks-deep-ink/registry'],
    },
  }),
};

export default config;
