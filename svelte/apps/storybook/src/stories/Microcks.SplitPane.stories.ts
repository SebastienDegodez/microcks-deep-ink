import exampleSource0 from './Microcks.SplitPane/ListAndDetail.svelte?raw';
import exampleSource1 from './Microcks.SplitPane/StretchAndBalanced.svelte?raw';
import exampleSource2 from './Microcks.SplitPane/DetailFirst.svelte?raw';
import exampleSource3 from './Microcks.SplitPane/KeepSideMax.svelte?raw';
import exampleSource4 from './Microcks.SplitPane/Playground.svelte?raw';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { SplitPane } from '@microcks/deep-ink';
import { itemParams } from './_meta';

import ListAndDetailView from './Microcks.SplitPane/ListAndDetail.svelte';
import StretchAndBalancedView from './Microcks.SplitPane/StretchAndBalanced.svelte';
import DetailFirstView from './Microcks.SplitPane/DetailFirst.svelte';
import KeepSideMaxView from './Microcks.SplitPane/KeepSideMax.svelte';
import PlaygroundView, { defaultChildren } from './Microcks.SplitPane/Playground.svelte';

export default {
  title: 'Microcks/SplitPane',
  component: SplitPane,
  parameters: itemParams(['split-pane'], 'List + detail layout. The side pane grows to a cap, the main pane takes the rest and wraps under the list on narrow screens. The DOM order is the reading order.'),
} satisfies Meta<typeof SplitPane>;


export const ListAndDetail: StoryObj<typeof ListAndDetailView> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, name: 'List and detail', render: () => ({ Component: ListAndDetailView, props: {} }) };

/** `align="stretch"` makes both panes as tall as the taller one; `balanced` shares the width; `gap` sets the spacing. */
export const StretchAndBalanced: StoryObj<typeof StretchAndBalancedView> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } }, name: 'Stretch, balanced and gap', render: () => ({ Component: StretchAndBalancedView, props: {} }) };

export const DetailFirst: StoryObj<typeof DetailFirstView> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } }, name: 'Wide list, detail on the right (Traces, Hub)', render: () => ({ Component: DetailFirstView, props: {} }) };

/** `keepSideMax` keeps the side cap below 720px: the rail stays 360px wide instead of filling the row (Service, Copilot). */
export const KeepSideMax: StoryObj<typeof KeepSideMaxView> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } }, name: 'Keep the side cap on narrow screens', render: () => ({ Component: KeepSideMaxView, props: {} }) };

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof SplitPane> = {
  parameters: { docs: { source: { code: exampleSource4, language: 'svelte', type: 'code' } } }, render: (args) => ({ Component: PlaygroundView, props: args }),
  args: { sideWidth: '280px', sideMax: undefined, mainWidth: undefined, gap: undefined, align: 'start', balanced: false, keepSideMax: false, children: defaultChildren },
  argTypes: { align: { control: 'inline-radio', options: ['start','stretch'] } } };

