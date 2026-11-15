import type { Preview } from '@storybook/svelte-vite';
import '@microcks/deep-ink/styles.css';
import '@microcks-deep-ink/storybook-shared/foundations.css';
import './docs/docs.css';
import './svelte-syntax';
import { theme } from './theme';
import { DocsPage } from './docs/DocsPage';
import ThemeFrame from './ThemeFrame.svelte';

try { document.documentElement.lang = 'en'; } catch { /* static analysis */ }
const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Deep Ink theme',
      toolbar: {
        title: 'Theme', icon: 'mirror',
        items: [
          { value: 'dark', title: 'Deep Ink (dark)', icon: 'moon' },
          { value: 'light', title: 'Paper (light)', icon: 'sun' },
        ], dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'dark', framework: 'svelte' },
  decorators: [(story, ctx) => ({ Component: ThemeFrame, props: { theme: ctx.globals.theme ?? 'dark', fullscreen: ctx.parameters.layout === 'fullscreen' }, children: story() })],
  parameters: {
    layout: 'padded', backgrounds: { disable: true },
    controls: { expanded: true, matchers: { color: /(background|color)$/i } },
    docs: { theme, page: DocsPage },
    options: {
      selectedPanel: 'deep-ink/copy',
      storySort: { order: ['Introduction', 'Getting started', 'Usage', ['Natural components', 'Microcks components', 'Elements'], 'Foundations', 'Components', 'Microcks', 'Elements', 'Patterns', 'Plugins'] },
    },
    a11y: { test: 'error' },
  },
};
export default preview;
