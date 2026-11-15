import exampleSource0 from './Microcks.ConformanceBand/Default.svelte?raw';
import exampleSource1 from './Microcks.ConformanceBand/CustomUnit.svelte?raw';
import exampleSource2 from './Microcks.ConformanceBand/Mini.svelte?raw';
import exampleSource3 from './Microcks.ConformanceBand/Failing.svelte?raw';
import exampleSource4 from './Microcks.ConformanceBand/Labelled.svelte?raw';
import exampleSource5 from './Microcks.ConformanceBand/WithSummary.svelte?raw';
import exampleSource6 from './Microcks.ConformanceBand/Playground.svelte?raw';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { ConformanceBand } from '@microcks/deep-ink';
import { itemParams } from './_meta';

import DefaultView from './Microcks.ConformanceBand/Default.svelte';
import CustomUnitView from './Microcks.ConformanceBand/CustomUnit.svelte';
import MiniView from './Microcks.ConformanceBand/Mini.svelte';
import FailingView from './Microcks.ConformanceBand/Failing.svelte';
import LabelledView from './Microcks.ConformanceBand/Labelled.svelte';
import WithSummaryView from './Microcks.ConformanceBand/WithSummary.svelte';
import PlaygroundView from './Microcks.ConformanceBand/Playground.svelte';

export default {
  title: 'Microcks/ConformanceBand',
  component: ConformanceBand,
  parameters: itemParams(['conformance-band'], 'One segment per operation. The band is `role="img"` with a sentence ("11 of 12 operations pass, 1 fails"). Failed segments are hatched as well as colored, and the full size writes the summary.'),
} satisfies Meta<typeof ConformanceBand>;


export const Default: StoryObj<typeof DefaultView> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, render: () => ({ Component: DefaultView, props: {} }) };

/** `unit` changes the noun in the accessible summary ("3 of 4 conversations passed"). */
export const CustomUnit: StoryObj<typeof CustomUnitView> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } }, name: 'Custom unit', render: () => ({ Component: CustomUnitView, props: {} }) };

export const Mini: StoryObj<typeof MiniView> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } }, render: () => ({ Component: MiniView, props: {} }) };

export const Failing: StoryObj<typeof FailingView> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } }, render: () => ({ Component: FailingView, props: {} }) };

export const Labelled: StoryObj<typeof LabelledView> = {
  parameters: { docs: { source: { code: exampleSource4, language: 'svelte', type: 'code' } } }, name: 'Labels under each cell', render: () => ({ Component: LabelledView, props: {} }) };

export const WithSummary: StoryObj<typeof WithSummaryView> = {
  parameters: { docs: { source: { code: exampleSource5, language: 'svelte', type: 'code' } } }, name: 'With summary', render: () => ({ Component: WithSummaryView, props: {} }) };

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof ConformanceBand> = {
  parameters: { docs: { source: { code: exampleSource6, language: 'svelte', type: 'code' } } }, render: (args) => ({ Component: PlaygroundView, props: args }),
  args: { outcomes: ['pass','pass','fail','pass','untested','pass'], size: 'full', unit: 'operation', showSummary: true },
  argTypes: { size: { control: 'inline-radio', options: ['full','mini'] } } };

