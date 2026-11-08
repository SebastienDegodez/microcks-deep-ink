import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { SummaryStrip } from '@microcks/deep-ink';
import { itemParams } from './_meta';

import SavedView from './Microcks.SummaryStrip/Saved.svelte';
import DispatcherView from './Microcks.SummaryStrip/Dispatcher.svelte';
import CanvasView from './Microcks.SummaryStrip/Canvas.svelte';
import FromContentView from './Microcks.SummaryStrip/FromContent.svelte';
import PlaygroundView from './Microcks.SummaryStrip/Playground.svelte';

export default {
  title: 'Microcks/SummaryStrip',
  component: SummaryStrip,
  parameters: itemParams(['summary-strip'], 'Key facts in one bordered row, separated by decorative 1px rules. The words carry the meaning; add role="note" for a page summary.'),
} satisfies Meta<typeof SummaryStrip>;


export const Saved: StoryObj<typeof SavedView> = { render: () => ({ Component: SavedView, props: {} }) };

export const Dispatcher: StoryObj<typeof DispatcherView> = { name: 'Dispatcher summary (values in text)', render: () => ({ Component: DispatcherView, props: {} }) };

export const Canvas: StoryObj<typeof CanvasView> = { name: 'Canvas (Agent test setup)', render: () => ({ Component: CanvasView, props: {} }) };

export const FromContent: StoryObj<typeof FromContentView> = { name: 'Built from content', render: () => ({ Component: FromContentView, props: {} }) };

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof SummaryStrip> = { render: (args) => ({ Component: PlaygroundView, props: args }),
  args: { gap: 'normal', values: 'secondary', variant: 'default', lineHeight: 'fixed', parts: [{ text: '12', kind: 'value' }, { text: 'operations', kind: 'label' }, { text: '', sep: true }, { text: '3', kind: 'value' }, { text: 'failing', kind: 'label' }] },
  argTypes: { gap: { control: 'inline-radio', options: ['normal', 'roomy'] }, values: { control: 'inline-radio', options: ['secondary', 'text'] }, variant: { control: 'inline-radio', options: ['default', 'canvas'] }, lineHeight: { control: 'inline-radio', options: ['fixed', 'inherit'] } } };

