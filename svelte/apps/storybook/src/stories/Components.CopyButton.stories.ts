import exampleSource0 from './Components.CopyButton/Default.svelte?raw';
import exampleSource1 from './Components.CopyButton/SizesAndVariants.svelte?raw';
import exampleSource2 from './Components.CopyButton/IconOnly.svelte?raw';
import exampleSource3 from './Components.CopyButton/Playground.svelte?raw';
import DefaultComposition from './Components.CopyButton/Default.svelte';
import SizesAndVariantsComposition from './Components.CopyButton/SizesAndVariants.svelte';
import IconOnlyComposition from './Components.CopyButton/IconOnly.svelte';
import PlaygroundComposition from './Components.CopyButton/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { CopyButton } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Copy button',
  component: CopyButton,
  parameters: itemParams(['copy-button'], 'Copies a value, then says so twice: the label switches for 2 seconds and a visually hidden polite live region announces "Copied" (or "Copy failed").'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** `size` and `variant` come from the button; `copiedLabel` is the label after a successful copy. */
export const SizesAndVariants: StoryObj<typeof SizesAndVariantsComposition> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  name: 'Sizes and variants',
  render: () => ({ Component: SizesAndVariantsComposition, props: {} })
};

export const IconOnly: StoryObj<typeof IconOnlyComposition> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } },
  name: 'Icon only',
  render: () => ({ Component: IconOnlyComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } },
  args: { value: 'http://localhost:8080/rest/API+Pastry/2.0.0', label: 'Copy URL', copiedLabel: 'Copied', size: 'md', variant: 'secondary' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'compact', 'tile', 'md', 'lg'] },
    variant: { control: 'select', options: ['primary', 'secondary', 'outline', 'ghost', 'link', 'dashed', 'danger'] },
  },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
