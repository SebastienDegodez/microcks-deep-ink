import type { Decorator, Preview } from '@storybook/react-vite';
import React, { useEffect } from 'react';
import { setTheme } from '@microcks-deep-ink/react';
import '@microcks-deep-ink/tokens/deep-ink.css';
import '@microcks-deep-ink/storybook-shared/foundations.css';
import { theme } from './theme';

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
  initialGlobals: { theme: 'dark' },
  decorators: [withTheme],
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true },
    controls: { expanded: true, matchers: { color: /(background|color)$/i } },
    docs: { theme },
    options: { storySort: { order: ['Introduction', 'Foundations', 'Signature', 'Actions', 'Feedback', 'Contract', 'Proof', 'Navigation', 'Workflows', 'Shell', 'Plugins'] } },
    a11y: { test: 'todo' },
  },
};

export default preview;
