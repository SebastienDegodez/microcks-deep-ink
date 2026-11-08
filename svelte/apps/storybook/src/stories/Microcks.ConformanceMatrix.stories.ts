import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { ConformanceMatrix } from '@microcks/deep-ink';
import { itemParams } from './_meta';
import { cellKey } from '@microcks/deep-ink';
import { MATRIX_COLUMNS, MATRIX_GROUPS } from '@microcks-deep-ink/storybook-shared/fixtures';
import DefaultView from './Microcks.ConformanceMatrix/Default.svelte';
import SelectableCellsView from './Microcks.ConformanceMatrix/SelectableCells.svelte';
import PlaygroundView from './Microcks.ConformanceMatrix/Playground.svelte';

export default {
  title: 'Microcks/ConformanceMatrix',
  component: ConformanceMatrix,
  parameters: itemParams(['conformance-matrix', 'icon'], 'Checks by columns (here the three A2A transports) as a real table. Each cell writes its result with a glyph and a word. A finished cell is a button that selects it; queued and running cells are plain text. A cell without a column spans all of them.'),
} satisfies Meta<typeof ConformanceMatrix>;

const FOOTER = { label: 'Conversations passed', cells: [{ text: '2/3', tone: 'danger' as const }, { text: '1/3' }, { text: '2/3', tone: 'danger' as const }] };
export const Default: StoryObj<typeof DefaultView> = { render: () => ({ Component: DefaultView, props: {} }) };

export const SelectableCells: StoryObj<typeof SelectableCellsView> = { render: () => ({ Component: SelectableCellsView, props: {} }) };

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof ConformanceMatrix> = { render: (args) => ({ Component: PlaygroundView, props: args }),
  args: { caption: 'Conformance matrix', columns: MATRIX_COLUMNS, groups: MATRIX_GROUPS, footer: FOOTER, selectedKey: cellKey('eclair-size-m','http') },
  argTypes: { onselectcell: { table: { disable: true } } } };

