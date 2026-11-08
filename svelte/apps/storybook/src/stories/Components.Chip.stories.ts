import DefaultComposition from './Components.Chip/Default.svelte';
import RemoveLabelComposition from './Components.Chip/RemoveLabel.svelte';
import VariantsComposition from './Components.Chip/Variants.svelte';
import ToggleComposition from './Components.Chip/Toggle.svelte';
import RemovableComposition from './Components.Chip/Removable.svelte';
import FiltersComposition from './Components.Chip/Filters.svelte';
import PlaygroundComposition from './Components.Chip/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Chip, type Protocol } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Chip',
  component: Chip,
  parameters: itemParams(['chip'], 'Static labels are a `<span>`. A chip with `pressed` is a toggle `<button aria-pressed>`. A removable chip has a remove button named "Remove <text>".'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** `removeLabel` names the remove button: it reads "Remove REST filter". */
export const RemoveLabel: StoryObj<typeof RemoveLabelComposition> = {
  name: 'Remove button label',
  render: () => ({ Component: RemoveLabelComposition, props: {} })
};

export const Variants: StoryObj<typeof VariantsComposition> = {
  render: () => ({ Component: VariantsComposition, props: {} })
};

export const Toggle: StoryObj<typeof ToggleComposition> = {
  render: () => ({ Component: ToggleComposition, props: {} })
};

export const Removable: StoryObj<typeof RemovableComposition> = {
  render: () => ({ Component: RemovableComposition, props: {} })
};

export const Filters: StoryObj<typeof FiltersComposition> = {
  name: 'Filters (labels and protocols)',
  render: () => ({ Component: FiltersComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { children: 'Conformant', tone: 'success', variant: 'solid', size: 'md', pressed: undefined, count: undefined, protocol: undefined, removeLabel: undefined },
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'info', 'success', 'warning', 'danger'] },
    variant: { control: 'inline-radio', options: ['solid', 'outline', 'dashed'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    protocol: { control: 'select', options: [undefined, 'REST', 'SOAP', 'EVENT', 'gRPC', 'GRAPHQL', 'DIRECT', 'A2A'] },
  },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
