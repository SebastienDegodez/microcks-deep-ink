import exampleSource0 from './Microcks.ProjectionPill/Default.svelte?raw';
import exampleSource1 from './Microcks.ProjectionPill/Playground.svelte?raw';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { ProjectionPill } from '@microcks/deep-ink';
import { itemParams } from './_meta';

import DefaultView from './Microcks.ProjectionPill/Default.svelte';
import PlaygroundView from './Microcks.ProjectionPill/Playground.svelte';

export default {
  title: 'Microcks/ProjectionPill',
  component: ProjectionPill,
  parameters: itemParams(['projection-pill'], 'Marks a proposed feature that does not exist in Microcks today. The visible words carry the meaning; the title only adds detail.'),
} satisfies Meta<typeof ProjectionPill>;


export const Default: StoryObj<typeof DefaultView> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, render: () => ({ Component: DefaultView, props: {} }) };

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<{ children?: string; title?: string }> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } }, render: (args) => ({ Component: PlaygroundView, props: args }),
  args: { children: 'Projection · v2 module' } };

