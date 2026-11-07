import type { StorybookConfig } from '@storybook/svelte-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts'],
  framework: { name: '@storybook/svelte-vite', options: {} },
  addons: [],
  core: { disableTelemetry: true },
};

export default config;
