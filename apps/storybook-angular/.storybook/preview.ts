import type { Decorator, Preview } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { setTheme } from '@microcks-deep-ink/angular';
import { theme } from './theme';

const withTheme: Decorator = (story, ctx) => {
  setTheme((ctx.globals['theme'] ?? 'dark') as 'dark' | 'light', false);
  return story();
};

const frame = componentWrapperDecorator(
  (story) => `<div style="background:var(--bg);color:var(--text);min-height:100%">${story}</div>`,
);

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
  decorators: [frame, withTheme],
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true },
    controls: { expanded: true },
    docs: { theme },
    options: { storySort: { order: ['Introduction', 'Foundations', 'Signature', 'Actions', 'Feedback', 'Contract', 'Navigation', 'Plugins'] } },
    a11y: { test: 'todo' },
  },
};

export default preview;
