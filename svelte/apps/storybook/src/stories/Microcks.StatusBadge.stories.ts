import exampleSource0 from './Microcks.StatusBadge/Default.svelte?raw';
import exampleSource1 from './Microcks.StatusBadge/Small.svelte?raw';
import exampleSource2 from './Microcks.StatusBadge/Large.svelte?raw';
import exampleSource3 from './Microcks.StatusBadge/Bare.svelte?raw';
import exampleSource4 from './Microcks.StatusBadge/Playground.svelte?raw';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { StatusBadge } from '@microcks/deep-ink';
import { itemParams } from './_meta';

import DefaultView from './Microcks.StatusBadge/Default.svelte';
import SmallView from './Microcks.StatusBadge/Small.svelte';
import LargeView from './Microcks.StatusBadge/Large.svelte';
import BareView from './Microcks.StatusBadge/Bare.svelte';
import PlaygroundView from './Microcks.StatusBadge/Playground.svelte';

export default {
  title: 'Microcks/StatusBadge',
  component: StatusBadge,
  parameters: itemParams(['status-badge', 'icon'], 'An icon and a word, always. The icon shapes differ (check, cross, triangle, arc, circle), so the status is readable without color.'),
} satisfies Meta<typeof StatusBadge>;


export const Default: StoryObj<typeof DefaultView> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, render: () => ({ Component: DefaultView, props: {} }) };

export const Small: StoryObj<typeof SmallView> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } }, render: () => ({ Component: SmallView, props: {} }) };

export const Large: StoryObj<typeof LargeView> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } }, name: 'Large (page-level status)', render: () => ({ Component: LargeView, props: {} }) };

export const Bare: StoryObj<typeof BareView> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } }, name: 'Bare (step outcomes)', render: () => ({ Component: BareView, props: {} }) };

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof StatusBadge> = {
  parameters: { docs: { source: { code: exampleSource4, language: 'svelte', type: 'code' } } }, render: (args) => ({ Component: PlaygroundView, props: args }),
  args: { status: 'conformant', size: 'md', shape: 'circled' },
  argTypes: { status: { control: 'select', options: ['conformant', 'failed', 'partial', 'running', 'never'] }, size: { control: 'inline-radio', options: ['md', 'sm', 'lg'] }, label: { control: 'text', description: 'Overrides the word (Snippet). Unset keeps the default word.' }, shape: { control: 'inline-radio', options: ['circled', 'bare'] } } };

