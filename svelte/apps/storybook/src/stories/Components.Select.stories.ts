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
  render: () => ({ Component: DefaultComposition })
};

export const Small: StoryObj<typeof SmallComposition> = {
  render: () => ({ Component: SmallComposition })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { 'aria-label': 'Protocol', size: 'md', disabled: false, children: children },
  argTypes: { size: { control: 'inline-radio', options: ['md', 'sm'] } },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
