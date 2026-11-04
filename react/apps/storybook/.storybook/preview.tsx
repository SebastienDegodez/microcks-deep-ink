import type { Decorator, Preview } from '@storybook/react-vite';
import React, { useEffect } from 'react';
import { setTheme } from '@microcks/deep-ink';
// The package stylesheet: tokens, base and every component, layered (the same file the demo loads).
import '@microcks/deep-ink/styles.css';
import '@microcks-deep-ink/storybook-shared/foundations.css';
import { theme } from './theme';

try {
  document.documentElement.lang = 'en';
} catch {
  /* no document (static analysis) */
}

const withTheme: Decorator = (Story, ctx) => {
  const t = (ctx.globals.theme ?? 'dark') as 'dark' | 'light';
  useEffect(() => setTheme(t, false), [t]);
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', padding: ctx.parameters.layout === 'fullscreen' ? 0 : 24, minHeight: '100%' }}>
      <Story />
    </div>
  );
};

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Deep Ink theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'dark', title: 'Deep Ink (dark)', icon: 'moon' },
          { value: 'light', title: 'Paper (light)', icon: 'sun' },
        ],
        dynamicTitle: true,
      },
    },
  },
  // `framework` is read by the Copy panel to pick the source to show.
  initialGlobals: { theme: 'dark', framework: 'react' },
  decorators: [withTheme],
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true },
    controls: { expanded: true, matchers: { color: /(background|color)$/i } },
    docs: { theme },
    options: {
      selectedPanel: 'deep-ink/copy',
      storySort: { order: ['Introduction', 'Foundations', 'Components', 'Microcks', 'Elements', 'Patterns', 'Plugins'] },
    },
    a11y: { test: 'error' },
  },
};

export default preview;
