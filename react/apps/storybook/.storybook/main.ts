import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-mcp',
  ],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  // Hide the "Get started" onboarding checklist (sidebar widget and menu entry).
  features: { sidebarOnboardingChecklist: false, menuOnboardingChecklist: false },
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
