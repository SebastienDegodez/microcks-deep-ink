import type { Decorator, Preview } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { setTheme } from '@microcks-deep-ink/registry/angular/theme-toggle.theme';
import { theme } from './theme';

try {
  document.documentElement.lang = 'en';
} catch {
  /* no document (static analysis) */
}

const withTheme: Decorator = (story, ctx) => {
  setTheme((ctx.globals['theme'] ?? 'dark') as 'dark' | 'light', false);
  return story();
};

const frame = componentWrapperDecorator(
  (story) => `<div style="background:var(--bg);color:var(--text);min-height:100%">${story}</div>`,
);

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
  initialGlobals: { theme: 'dark', framework: 'angular' },
  decorators: [frame, withTheme],
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true },
    controls: { expanded: true, matchers: { color: /(background|color)$/i } },
    docs: { theme },
    options: {
      selectedPanel: 'deep-ink/copy',
      storySort: { order: ['Introduction', 'Foundations', 'Components', 'Microcks', 'Elements', 'Patterns', 'Plugins'] },
    },
    // A violation fails the story (and the test runner / smoke).
    a11y: { test: 'error' },
  },
};

export default preview;
