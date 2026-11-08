import DefaultComposition from './Components.Disclosure/Default.svelte';
import { children } from './Components.Disclosure/PlaygroundContent.svelte';
import PlaygroundComposition from './Components.Disclosure/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Disclosure } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Disclosure',
  component: Disclosure,
  parameters: itemParams(['disclosure'], 'A native `<details>`/`<summary>`: Enter and Space toggle it, the open state is exposed by the browser.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  render: () => ({ Component: DefaultComposition })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { summary: 'Advanced options', defaultOpen: false, children: children },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
