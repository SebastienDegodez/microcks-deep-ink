import type { Preview } from '@storybook/svelte-vite';
import '@microcks/deep-ink/styles.css';
import './preview.css';

const preview: Preview = {
  parameters: { layout: 'padded' },
  globalTypes: {
    theme: {
      description: 'Deep Ink theme',
      toolbar: { icon: 'paintbrush', items: ['light', 'dark'] },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (story, context) => {
      document.documentElement.dataset.theme = context.globals.theme;
      return story();
    },
  ],
};

export default preview;
