import DefaultComposition from './Components.Dialog/Default.svelte';
import SizesComposition from './Components.Dialog/Sizes.svelte';
import DestructiveComposition from './Components.Dialog/Destructive.svelte';
import { children } from './Components.Dialog/PlaygroundContent.svelte';
import PlaygroundComposition from './Components.Dialog/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Button } from '@microcks/deep-ink';
import { Dialog } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Dialog',
  component: Dialog,
  parameters: itemParams(['dialog', 'button'], 'A native `<dialog>` opened with `showModal()`: focus is trapped by the browser, Escape closes it and focus returns to the opener.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  render: () => ({ Component: DefaultComposition })
};

/** `size="sm"` for confirmations, `size="lg"` for wide content. `closeOnBackdrop` also closes on a click outside. */
export const Sizes: StoryObj<typeof SizesComposition> = {
  render: () => ({ Component: SizesComposition })
};

export const Destructive: StoryObj<typeof DestructiveComposition> = {
  render: () => ({ Component: DestructiveComposition })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { title: 'Import a contract', description: 'Choose an OpenAPI, AsyncAPI, gRPC or GraphQL file.', size: 'md', closeOnBackdrop: false, children: children },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] }, open: { table: { disable: true } }, onclose: { table: { disable: true } } },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
