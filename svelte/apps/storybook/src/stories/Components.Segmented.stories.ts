import DefaultComposition from './Components.Segmented/Default.svelte';
import DotsAndIconsComposition from './Components.Segmented/DotsAndIcons.svelte';
import JoinedComposition from './Components.Segmented/Joined.svelte';
import JoinedPrimaryComposition from './Components.Segmented/JoinedPrimary.svelte';
import StatusIconsComposition from './Components.Segmented/StatusIcons.svelte';
import CompactComposition from './Components.Segmented/Compact.svelte';
import PlaygroundComposition from './Components.Segmented/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Segmented } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Segmented',
  component: Segmented,
  parameters: itemParams(['segmented'], 'A group of toggle buttons with `aria-pressed`, for filters such as All, Passed and Failed. Announce the result count elsewhere with a live region.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  render: () => ({ Component: DefaultComposition, props: {} })
};

export const DotsAndIcons: StoryObj<typeof DotsAndIconsComposition> = {
  name: 'Dots and icons',
  render: () => ({ Component: DotsAndIconsComposition, props: {} })
};

export const Joined: StoryObj<typeof JoinedComposition> = {
  render: () => ({ Component: JoinedComposition, props: {} })
};

export const JoinedPrimary: StoryObj<typeof JoinedPrimaryComposition> = {
  name: 'Joined, primary tone',
  render: () => ({ Component: JoinedPrimaryComposition, props: {} })
};

export const StatusIcons: StoryObj<typeof StatusIconsComposition> = {
  name: 'Toned icons, selected fill (Sources)',
  render: () => ({ Component: StatusIconsComposition, props: {} })
};

export const Compact: StoryObj<typeof CompactComposition> = {
  name: 'Joined sm and wide track (Behavior, Usage)',
  render: () => ({ Component: CompactComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { label: 'Status filter', value: 'all', variant: 'track', tone: 'neutral', pressedFill: 'raised', iconSize: 15, size: 'md', spacing: 'normal', options: [{ id: 'all', label: 'All', count: 12 }, { id: 'passed', label: 'Passed', count: 9, dot: 'success' }, { id: 'failed', label: 'Failed', count: 3, dot: 'danger' }] },
  argTypes: {
    variant: { control: 'inline-radio', options: ['track', 'joined'] },
    tone: { control: 'inline-radio', options: ['neutral', 'primary'] },
    pressedFill: { control: 'inline-radio', options: ['raised', 'selected'] },
    iconSize: { control: 'inline-radio', options: [13, 15] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    spacing: { control: 'inline-radio', options: ['normal', 'wide'] },
    onchange: { table: { disable: true } },
  },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
