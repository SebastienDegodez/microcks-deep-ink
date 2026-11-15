import exampleSource0 from './Components.Dialog/Default.svelte?raw';
import exampleSource1 from './Components.Dialog/Demo.svelte?raw';
import exampleSource2 from './Components.Dialog/Sizes.svelte?raw';
import exampleSource3 from './Components.Dialog/SizeDemo.svelte?raw';
import exampleSource4 from './Components.Dialog/Destructive.svelte?raw';
import exampleSource5 from './Components.Dialog/Playground.svelte?raw';
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
  parameters: { docs: { source: { code: ["<!-- Components.Dialog/Default.svelte -->", exampleSource0, "<!-- Components.Dialog/Demo.svelte -->", exampleSource1].join('\n\n'), language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** `size="sm"` for confirmations, `size="lg"` for wide content. `closeOnBackdrop` also closes on a click outside. */
export const Sizes: StoryObj<typeof SizesComposition> = {
  parameters: { docs: { source: { code: ["<!-- Components.Dialog/Sizes.svelte -->", exampleSource2, "<!-- Components.Dialog/SizeDemo.svelte -->", exampleSource3].join('\n\n'), language: 'svelte', type: 'code' } } },
  render: () => ({ Component: SizesComposition, props: {} })
};

export const Destructive: StoryObj<typeof DestructiveComposition> = {
  parameters: { docs: { source: { code: ["<!-- Components.Dialog/Destructive.svelte -->", exampleSource4, "<!-- Components.Dialog/Demo.svelte -->", exampleSource1].join('\n\n'), language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DestructiveComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: { docs: { source: { code: exampleSource5, language: 'svelte', type: 'code' } } },
  args: { title: 'Import a contract', description: 'Choose an OpenAPI, AsyncAPI, gRPC or GraphQL file.', size: 'md', closeOnBackdrop: false, children: children },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] }, open: { table: { disable: true } }, onclose: { table: { disable: true } } },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
