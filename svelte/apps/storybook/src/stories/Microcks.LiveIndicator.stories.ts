import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { LiveIndicator } from '@microcks/deep-ink';
import { itemParams } from './_meta';

import DefaultView from './Microcks.LiveIndicator/Default.svelte';
import PausedView from './Microcks.LiveIndicator/Paused.svelte';
import CompactStaticView from './Microcks.LiveIndicator/CompactStatic.svelte';
import CustomLabelView from './Microcks.LiveIndicator/CustomLabel.svelte';
import SizesAndPausedLabelView from './Microcks.LiveIndicator/SizesAndPausedLabel.svelte';
import BoxView from './Microcks.LiveIndicator/Box.svelte';
import PlaygroundView from './Microcks.LiveIndicator/Playground.svelte';

export default {
  title: 'Microcks/LiveIndicator',
  component: LiveIndicator,
  parameters: itemParams(['live-indicator'], 'Marks a real-time stream only. It is not a status and not a live region: pair it with a Pause control (RGAA 13.8) and announce stream changes elsewhere. The dot is static under reduced motion.'),
} satisfies Meta<typeof LiveIndicator>;


export const Default: StoryObj<typeof DefaultView> = { render: () => ({ Component: DefaultView }) };

export const Paused: StoryObj<typeof PausedView> = { render: () => ({ Component: PausedView }) };

export const CompactStatic: StoryObj<typeof CompactStaticView> = { name: 'Compact, static dot', render: () => ({ Component: CompactStaticView }) };

export const CustomLabel: StoryObj<typeof CustomLabelView> = { name: 'Custom label', render: () => ({ Component: CustomLabelView }) };

export const SizesAndPausedLabel: StoryObj<typeof SizesAndPausedLabelView> = { name: 'Small, inline, dot and paused label', render: () => ({ Component: SizesAndPausedLabelView }) };

export const Box: StoryObj<typeof BoxView> = { name: 'Box (in place of a busy button)', render: () => ({ Component: BoxView }) };

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof LiveIndicator> = { render: (args) => ({ Component: PlaygroundView, props: args }),
  args: { label: 'live', paused: false, pausedLabel: 'paused', size: 'md', variant: 'pill', pulse: true },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'compact', 'lg'] }, variant: { control: 'inline-radio', options: ['pill', 'inline', 'box', 'dot'] } } };

