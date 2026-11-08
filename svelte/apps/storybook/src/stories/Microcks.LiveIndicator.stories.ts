import exampleSource0 from './Microcks.LiveIndicator/Default.svelte?raw';
import exampleSource1 from './Microcks.LiveIndicator/Paused.svelte?raw';
import exampleSource2 from './Microcks.LiveIndicator/CompactStatic.svelte?raw';
import exampleSource3 from './Microcks.LiveIndicator/CustomLabel.svelte?raw';
import exampleSource4 from './Microcks.LiveIndicator/SizesAndPausedLabel.svelte?raw';
import exampleSource5 from './Microcks.LiveIndicator/Box.svelte?raw';
import exampleSource6 from './Microcks.LiveIndicator/Playground.svelte?raw';
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


export const Default: StoryObj<typeof DefaultView> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, render: () => ({ Component: DefaultView, props: {} }) };

export const Paused: StoryObj<typeof PausedView> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } }, render: () => ({ Component: PausedView, props: {} }) };

export const CompactStatic: StoryObj<typeof CompactStaticView> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } }, name: 'Compact, static dot', render: () => ({ Component: CompactStaticView, props: {} }) };

export const CustomLabel: StoryObj<typeof CustomLabelView> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } }, name: 'Custom label', render: () => ({ Component: CustomLabelView, props: {} }) };

export const SizesAndPausedLabel: StoryObj<typeof SizesAndPausedLabelView> = {
  parameters: { docs: { source: { code: exampleSource4, language: 'svelte', type: 'code' } } }, name: 'Small, inline, dot and paused label', render: () => ({ Component: SizesAndPausedLabelView, props: {} }) };

export const Box: StoryObj<typeof BoxView> = {
  parameters: { docs: { source: { code: exampleSource5, language: 'svelte', type: 'code' } } }, name: 'Box (in place of a busy button)', render: () => ({ Component: BoxView, props: {} }) };

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof LiveIndicator> = {
  parameters: { docs: { source: { code: exampleSource6, language: 'svelte', type: 'code' } } }, render: (args) => ({ Component: PlaygroundView, props: args }),
  args: { label: 'live', paused: false, pausedLabel: 'paused', size: 'md', variant: 'pill', pulse: true },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'compact', 'lg'] }, variant: { control: 'inline-radio', options: ['pill', 'inline', 'box', 'dot'] } } };

