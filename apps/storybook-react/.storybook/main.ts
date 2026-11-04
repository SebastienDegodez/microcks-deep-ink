import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

// TEMPORARY (until the Storybook moves into react/): the React sources left packages/registry for
// react/packages/deep-ink/src. Stories keep their `@microcks-deep-ink/registry/react/<item>` imports through this
// alias (and the matching tsconfig paths); react and react-dom are deduped so the moved sources use this app's copy.
const REACT_SRC = fileURLToPath(new URL('../../../react/packages/deep-ink/src', import.meta.url));

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
      alias: [
        { find: /^@microcks-deep-ink\/registry\/react\/(.*)$/, replacement: `${REACT_SRC}/$1` },
        ...(Array.isArray(cfg.resolve?.alias)
          ? cfg.resolve.alias
          : Object.entries(cfg.resolve?.alias ?? {}).map(([find, replacement]) => ({ find, replacement: replacement as string }))),
      ],
      dedupe: [...(cfg.resolve?.dedupe ?? []), 'react', 'react-dom'],
    },
  }),
};

export default config;
