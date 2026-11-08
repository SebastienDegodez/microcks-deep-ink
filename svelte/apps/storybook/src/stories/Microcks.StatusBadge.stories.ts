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


export const Default: StoryObj<typeof DefaultView> = { render: () => ({ Component: DefaultView }) };

export const Small: StoryObj<typeof SmallView> = { render: () => ({ Component: SmallView }) };

export const Large: StoryObj<typeof LargeView> = { name: 'Large (page-level status)', render: () => ({ Component: LargeView }) };

export const Bare: StoryObj<typeof BareView> = { name: 'Bare (step outcomes)', render: () => ({ Component: BareView }) };

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof StatusBadge> = { render: (args) => ({ Component: PlaygroundView, props: args }),
  args: { status: 'conformant', size: 'md', shape: 'circled' },
  argTypes: { status: { control: 'select', options: ['conformant', 'failed', 'partial', 'running', 'never'] }, size: { control: 'inline-radio', options: ['md', 'sm', 'lg'] }, label: { control: 'text', description: 'Overrides the word (Snippet). Unset keeps the default word.' }, shape: { control: 'inline-radio', options: ['circled', 'bare'] } } };

