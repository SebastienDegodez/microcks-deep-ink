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


export const Default: StoryObj<typeof DefaultView> = { render: () => ({ Component: DefaultView, props: {} }) };

/** `unit` changes the noun in the accessible summary ("3 of 4 conversations passed"). */
export const CustomUnit: StoryObj<typeof CustomUnitView> = { name: 'Custom unit', render: () => ({ Component: CustomUnitView, props: {} }) };

export const Mini: StoryObj<typeof MiniView> = { render: () => ({ Component: MiniView, props: {} }) };

export const Failing: StoryObj<typeof FailingView> = { render: () => ({ Component: FailingView, props: {} }) };

export const Labelled: StoryObj<typeof LabelledView> = { name: 'Labels under each cell', render: () => ({ Component: LabelledView, props: {} }) };

export const WithSummary: StoryObj<typeof WithSummaryView> = { name: 'With summary', render: () => ({ Component: WithSummaryView, props: {} }) };

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof ConformanceBand> = { render: (args) => ({ Component: PlaygroundView, props: args }),
  args: { outcomes: ['pass','pass','fail','pass','untested','pass'], size: 'full', unit: 'operation', showSummary: true },
  argTypes: { size: { control: 'inline-radio', options: ['full','mini'] } } };

