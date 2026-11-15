import exampleSource0 from './Components.DataTable/Default.svelte?raw';
import exampleSource1 from './Components.DataTable/RouterLinks.svelte?raw';
import exampleSource2 from './Components.DataTable/Sortable.svelte?raw';
import exampleSource3 from './Components.DataTable/RowLinks.svelte?raw';
import exampleSource4 from './Components.DataTable/Compact.svelte?raw';
import exampleSource5 from './Components.DataTable/Empty.svelte?raw';
import exampleSource6 from './Components.DataTable/HiddenHeader.svelte?raw';
import exampleSource7 from './Components.DataTable/SentenceCase.svelte?raw';
import exampleSource8 from './Components.DataTable/SelectableRowHeader.svelte?raw';
import exampleSource9 from './Components.DataTable/Playground.svelte?raw';
import DefaultComposition from './Components.DataTable/Default.svelte';
import RouterLinksComposition from './Components.DataTable/RouterLinks.svelte';
import SortableComposition from './Components.DataTable/Sortable.svelte';
import RowLinksComposition from './Components.DataTable/RowLinks.svelte';
import CompactComposition from './Components.DataTable/Compact.svelte';
import EmptyComposition from './Components.DataTable/Empty.svelte';
import HiddenHeaderComposition from './Components.DataTable/HiddenHeader.svelte';
import SentenceCaseComposition from './Components.DataTable/SentenceCase.svelte';
import SelectableRowHeaderComposition from './Components.DataTable/SelectableRowHeader.svelte';
import PlaygroundComposition from './Components.DataTable/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { DataTable, sortRows, type SortState } from '@microcks/deep-ink';
import { CATALOGUE_COLUMNS, CATALOGUE_ROWS, type CatalogueRow } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';
type RunRow = { id: string; run: string; result: string; duration: string };
const RUN_ROWS: RunRow[] = [
  { id: '16', run: '#16', result: 'Failed · step updatePrice', duration: '1.42 s' },
  { id: '15', run: '#15', result: 'Passed', duration: '0.98 s' },
  { id: '14', run: '#14', result: 'Idle · never run against implementations', duration: '—' },
];
type TaskRow = { id: string; skill: string; updated: string };
const TASK_ROWS: TaskRow[] = [
  { id: 'task-7f3a', skill: 'restock-pastry', updated: 'now' },
  { id: 'task-41c2', skill: 'compare-prices', updated: '2 min ago' },
  { id: 'task-09be', skill: '— no match', updated: '1 h ago' },
];
const TASK_COLUMNS = [
  { key: 'id', header: 'Task', mono: true, rowHeader: true, width: '116px' },
  { key: 'skill', header: 'Skill' },
  { key: 'updated', header: 'Updated', align: 'end' as const, width: '100px' },
];

export default {
  title: 'Components/Data table',
  component: DataTable,
  parameters: itemParams(['table', 'icon'], 'A native `<table>` with a caption, `th scope="col"`, `aria-sort` on sortable headers (a real button inside) and a focusable scroll region. With `rowHref` the first cell holds a link stretched over the row: no clickable `<tr>`.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** `renderRowLink` renders the row link with your router instead of a plain `<a>`. */
export const RouterLinks: StoryObj<typeof RouterLinksComposition> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  name: 'Router links (renderRowLink)',
  render: () => ({ Component: RouterLinksComposition, props: {} })
};

export const Sortable: StoryObj<typeof SortableComposition> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: SortableComposition, props: {} })
};

export const RowLinks: StoryObj<typeof RowLinksComposition> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } },
  name: 'Row links',
  render: () => ({ Component: RowLinksComposition, props: {} })
};

export const Compact: StoryObj<typeof CompactComposition> = {
  parameters: { docs: { source: { code: exampleSource4, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: CompactComposition, props: {} })
};

export const Empty: StoryObj<typeof EmptyComposition> = {
  parameters: { docs: { source: { code: exampleSource5, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: EmptyComposition, props: {} })
};

export const HiddenHeader: StoryObj<typeof HiddenHeaderComposition> = {
  parameters: { docs: { source: { code: exampleSource6, language: 'svelte', type: 'code' } } },
  name: 'Hidden column header',
  render: () => ({ Component: HiddenHeaderComposition, props: {} })
};

export const SentenceCase: StoryObj<typeof SentenceCaseComposition> = {
  parameters: { docs: { source: { code: exampleSource7, language: 'svelte', type: 'code' } } },
  name: 'Sentence-case headers, row headers and row tones',
  render: () => ({ Component: SentenceCaseComposition, props: {} })
};

/** `layout="fixed"` with column `width`, `scroll={false}` (no region, no tab stop) and `onRowSelect`: the row header is a toggle button with `aria-pressed`. */
export const SelectableRowHeader: StoryObj<typeof SelectableRowHeaderComposition> = {
  parameters: { docs: { source: { code: exampleSource8, language: 'svelte', type: 'code' } } },
  name: 'Fixed layout, no scroll region, selectable row header',
  render: () => ({ Component: SelectableRowHeaderComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: { docs: { source: { code: exampleSource9, language: 'svelte', type: 'code' } } },
  args: { caption: 'Services', captionHidden: false, columns: CATALOGUE_COLUMNS, rows: CATALOGUE_ROWS, rowKey: (row) => (row as CatalogueRow).id, density: 'comfortable', headerCase: 'upper', emptyText: 'No service matches.', scroll: true, layout: 'auto' },
  argTypes: {
    density: { control: 'inline-radio', options: ['comfortable', 'compact'] },
    headerCase: { control: 'inline-radio', options: ['upper', 'sentence'] },
    scroll: { control: 'boolean' },
    layout: { control: 'inline-radio', options: ['auto', 'fixed'] },
  },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
