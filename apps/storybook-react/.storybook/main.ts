import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  // Published under GitHub Pages /react/ next to the Angular Storybook.
  viteFinal: async (cfg) => ({ ...cfg, base: process.env.SB_BASE ?? cfg.base }),
};

export default config;
