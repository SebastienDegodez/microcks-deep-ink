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
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** `Progress.max` for a count, and `Meter.min` for a range that does not start at zero. */
export const CustomRange: StoryObj<typeof CustomRangeComposition> = {
  name: 'Custom range',
  render: () => ({ Component: CustomRangeComposition, props: {} })
};

export const MeterStory: StoryObj<typeof MeterStoryComposition> = {
  name: 'Meter',
  render: () => ({ Component: MeterStoryComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { label: 'Importing operations', value: 60, max: 100 },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
