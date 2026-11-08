import exampleSource0 from './Microcks.MethodTag/Default.svelte?raw';
import exampleSource1 from './Microcks.MethodTag/AlignedInAList.svelte?raw';
import exampleSource2 from './Microcks.MethodTag/Small.svelte?raw';
import exampleSource3 from './Microcks.MethodTag/Playground.svelte?raw';
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


export const Default: StoryObj<typeof DefaultView> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, render: () => ({ Component: DefaultView, props: {} }) };

export const AlignedInAList: StoryObj<typeof AlignedInAListView> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } }, name: 'Aligned in a list', render: () => ({ Component: AlignedInAListView, props: {} }) };

export const Small: StoryObj<typeof SmallView> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } }, name: 'Small and extra small', render: () => ({ Component: SmallView, props: {} }) };

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof MethodTag> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } }, render: (args) => ({ Component: PlaygroundView, props: args }),
  args: { method: 'GET', protocol: 'REST', size: 'md', minWidth: undefined },
  argTypes: { protocol: { control: 'select', options: ['REST', 'SOAP', 'EVENT', 'gRPC', 'GRAPHQL', 'DIRECT', 'A2A'] }, size: { control: 'inline-radio', options: ['md', 'sm', 'xs'] } } };

