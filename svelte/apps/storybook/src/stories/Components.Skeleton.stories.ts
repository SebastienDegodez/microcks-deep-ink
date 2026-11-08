import exampleSource0 from './Components.Skeleton/Default.svelte?raw';
import exampleSource1 from './Components.Skeleton/Widths.svelte?raw';
import exampleSource2 from './Components.Skeleton/Playground.svelte?raw';
import DefaultComposition from './Components.Skeleton/Default.svelte';
import WidthsComposition from './Components.Skeleton/Widths.svelte';
import PlaygroundComposition from './Components.Skeleton/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Skeleton } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: itemParams(['skeleton'], 'Placeholder lines, hidden from assistive technology. The container sets `aria-busy` and a status message says what loads. Static under reduced motion.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** `width` sets the width of the last line or of a single block. */
export const Widths: StoryObj<typeof WidthsComposition> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: WidthsComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } },
  args: { lines: 3, width: '60%' },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
