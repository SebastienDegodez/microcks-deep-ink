import exampleSource0 from './Components.Menu/Default.svelte?raw';
import exampleSource1 from './Components.Menu/AlignEnd.svelte?raw';
import exampleSource2 from './Components.Menu/IconOnly.svelte?raw';
import exampleSource3 from './Components.Menu/SeparatorAndDescription.svelte?raw';
import exampleSource4 from './Components.Menu/Playground.svelte?raw';
import DefaultComposition from './Components.Menu/Default.svelte';
import AlignEndComposition from './Components.Menu/AlignEnd.svelte';
import IconOnlyComposition from './Components.Menu/IconOnly.svelte';
import SeparatorAndDescriptionComposition from './Components.Menu/SeparatorAndDescription.svelte';
import PlaygroundComposition from './Components.Menu/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Menu } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Menu',
  component: Menu,
  parameters: itemParams(['menu', 'button'], 'A disclosure menu on the native `popover` attribute: the trigger is a button with `aria-expanded`, Escape and click outside close it natively. It is not an ARIA `role="menu"` application menu.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** `align="end"` opens the list towards the start of the page, for a menu at the right edge. */
export const AlignEnd: StoryObj<typeof AlignEndComposition> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  name: 'Aligned to the end',
  render: () => ({ Component: AlignEndComposition, props: {} })
};

export const IconOnly: StoryObj<typeof IconOnlyComposition> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } },
  name: 'Icon only',
  render: () => ({ Component: IconOnlyComposition, props: {} })
};

export const SeparatorAndDescription: StoryObj<typeof SeparatorAndDescriptionComposition> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } },
  name: 'Separator and description',
  render: () => ({ Component: SeparatorAndDescriptionComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: { docs: { source: { code: exampleSource4, language: 'svelte', type: 'code' } } },
  args: { label: 'Actions', iconOnly: false, variant: 'secondary', size: 'md', align: 'start', items: [
      { id: 'edit', label: 'Edit', description: 'Change the service metadata.' },
      { id: 'export', label: 'Export' },
      { id: 'delete', label: 'Delete', danger: true, separatorBefore: true },
    ] },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'outline', 'ghost', 'link', 'dashed', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'compact', 'tile', 'md', 'lg'] },
    align: { control: 'inline-radio', options: ['start', 'end'] },
  },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
