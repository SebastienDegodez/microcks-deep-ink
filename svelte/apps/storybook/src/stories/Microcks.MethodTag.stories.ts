import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { MethodTag } from '@microcks/deep-ink';
import { itemParams } from './_meta';

import DefaultView from './Microcks.MethodTag/Default.svelte';
import AlignedInAListView from './Microcks.MethodTag/AlignedInAList.svelte';
import SmallView from './Microcks.MethodTag/Small.svelte';
import PlaygroundView from './Microcks.MethodTag/Playground.svelte';

export default {
  title: 'Microcks/MethodTag',
  component: MethodTag,
  parameters: itemParams(['method-tag'], 'The operation verb in mono, always written out. The color only speeds up scanning.'),
} satisfies Meta<typeof MethodTag>;


export const Default: StoryObj<typeof DefaultView> = { render: () => ({ Component: DefaultView }) };

export const AlignedInAList: StoryObj<typeof AlignedInAListView> = { name: 'Aligned in a list', render: () => ({ Component: AlignedInAListView }) };

export const Small: StoryObj<typeof SmallView> = { name: 'Small and extra small', render: () => ({ Component: SmallView }) };

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof MethodTag> = { render: (args) => ({ Component: PlaygroundView, props: args }),
  args: { method: 'GET', protocol: 'REST', size: 'md', minWidth: undefined },
  argTypes: { protocol: { control: 'select', options: ['REST', 'SOAP', 'EVENT', 'gRPC', 'GRAPHQL', 'DIRECT', 'A2A'] }, size: { control: 'inline-radio', options: ['md', 'sm', 'xs'] } } };

