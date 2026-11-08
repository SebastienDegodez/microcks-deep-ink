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
  render: () => ({ Component: DefaultComposition })
};

/** `align="end"` opens the list towards the start of the page, for a menu at the right edge. */
export const AlignEnd: StoryObj<typeof AlignEndComposition> = {
  name: 'Aligned to the end',
  render: () => ({ Component: AlignEndComposition })
};

export const IconOnly: StoryObj<typeof IconOnlyComposition> = {
  name: 'Icon only',
  render: () => ({ Component: IconOnlyComposition })
};

export const SeparatorAndDescription: StoryObj<typeof SeparatorAndDescriptionComposition> = {
  name: 'Separator and description',
  render: () => ({ Component: SeparatorAndDescriptionComposition })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
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
