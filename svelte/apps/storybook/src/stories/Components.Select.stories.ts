import exampleSource0 from './Components.Select/Default.svelte?raw';
import exampleSource1 from './Components.Select/Small.svelte?raw';
import exampleSource2 from './Components.Select/Playground.svelte?raw';
import DefaultComposition from './Components.Select/Default.svelte';
import SmallComposition from './Components.Select/Small.svelte';
import { children } from './Components.Select/PlaygroundContent.svelte';
import PlaygroundComposition from './Components.Select/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Select } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Select',
  component: Select,
  parameters: itemParams(['select'], 'The native `<select>`: the browser keeps keyboard, typeahead and the mobile picker.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultComposition, props: {} })
};

export const Small: StoryObj<typeof SmallComposition> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: SmallComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } },
  args: { 'aria-label': 'Protocol', size: 'md', disabled: false, children: children },
  argTypes: { size: { control: 'inline-radio', options: ['md', 'sm'] } },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
