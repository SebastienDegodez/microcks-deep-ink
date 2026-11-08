import DefaultComposition from './Components.Kbd/Default.svelte';
import PlaygroundComposition from './Components.Kbd/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Kbd } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Kbd',
  component: Kbd,
  parameters: itemParams(['kbd'], 'The native `<kbd>` element for key names. Write the key in words where a symbol is ambiguous.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { children: 'Ctrl K' },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
