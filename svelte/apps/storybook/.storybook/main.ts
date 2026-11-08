import type { StorybookConfig } from '@storybook/svelte-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.ts'],
  addons: ['@chromatic-com/storybook', '@storybook/addon-vitest', '@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: { name: '@storybook/svelte-vite', options: {} },
  core: { disableTelemetry: true },
  // Hide the "Get started" onboarding checklist (sidebar widget and menu entry).
  features: { sidebarOnboardingChecklist: false, menuOnboardingChecklist: false },
  viteFinal: async (cfg) => ({
    ...cfg,
    base: process.env.SB_BASE ?? cfg.base,
    resolve: {
      ...cfg.resolve,
      dedupe: [...(cfg.resolve?.dedupe ?? []), 'svelte', 'react', 'react-dom', '@microcks/deep-ink', '@microcks-deep-ink/plugin-sdk', '@microcks-deep-ink/registry'],
    },
  }),
};
export default config;
