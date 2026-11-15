import exampleSource0 from './Components.DescriptionList/Default.svelte?raw';
import exampleSource1 from './Components.DescriptionList/Playground.svelte?raw';
import DefaultComposition from './Components.DescriptionList/Default.svelte';
import PlaygroundComposition from './Components.DescriptionList/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { DescriptionList } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/DescriptionList',
  component: DescriptionList,
  parameters: itemParams(['description-list'], 'A native `<dl>`: terms and values are paired for assistive technology.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  args: { items: [
      { term: 'Service', value: 'API Pastry' },
      { term: 'Version', value: '2.0.0', mono: true },
      { term: 'Protocol', value: 'REST' },
    ] },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
