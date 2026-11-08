import exampleSource0 from './Components.Progress/Default.svelte?raw';
import exampleSource1 from './Components.Progress/CustomRange.svelte?raw';
import exampleSource2 from './Components.Progress/MeterStory.svelte?raw';
import exampleSource3 from './Components.Progress/Playground.svelte?raw';
import DefaultComposition from './Components.Progress/Default.svelte';
import CustomRangeComposition from './Components.Progress/CustomRange.svelte';
import MeterStoryComposition from './Components.Progress/MeterStory.svelte';
import PlaygroundComposition from './Components.Progress/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Meter, Progress } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Progress',
  component: Progress,
  parameters: itemParams(['progress'], 'Native `<progress>` and `<meter>`, each with a visible label. Without a value the progress is indeterminate.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** `Progress.max` for a count, and `Meter.min` for a range that does not start at zero. */
export const CustomRange: StoryObj<typeof CustomRangeComposition> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  name: 'Custom range',
  render: () => ({ Component: CustomRangeComposition, props: {} })
};

export const MeterStory: StoryObj<typeof MeterStoryComposition> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } },
  name: 'Meter',
  render: () => ({ Component: MeterStoryComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } },
  args: { label: 'Importing operations', value: 60, max: 100 },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
