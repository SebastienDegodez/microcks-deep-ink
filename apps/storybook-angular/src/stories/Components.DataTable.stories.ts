import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { DataTableComponent, CellDirective, TableDirective } from '@microcks-deep-ink/registry/angular/table';
import { IconComponent } from '@microcks-deep-ink/registry/angular/icon';
import { type CatalogueRow, CATALOGUE_COLUMNS, CATALOGUE_ROWS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { type SortState, sortRows } from '@microcks-deep-ink/registry/angular/table';
import { argTypesFor, itemParams, playground } from './_meta';

const meta: Meta = {
  title: 'Components/Data table',
  argTypes: argTypesFor('table', ['DataTableComponent', 'CellDirective', 'TableDirective']),
  decorators: [moduleMetadata({ imports: [TableDirective, DataTableComponent, CellDirective, IconComponent] })],
  parameters: itemParams(['table', 'icon'], "A native `<table>` with a caption, `th scope=\"col\"`, `aria-sort` on sortable headers (a real button inside) and a focusable scroll region. With `rowHref` the first cell holds a link stretched over the row: no clickable `<tr>`."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { columns: CATALOGUE_COLUMNS, rows: CATALOGUE_ROWS },
    template: `
<mk-data-table caption="Services" [columns]="columns" [rows]="rows" rowKey="id" />
    `,
  }),
};

/** The native table: `table[mkTable]` with `density` and `headerCase`, and rich cells with `ng-template[mkCell]`. */
export const NativeTable: StoryObj = {
  name: 'Native table (mkTable)',
  render: () => ({
    props: { rows: CATALOGUE_ROWS.slice(0, 3) },
    template: `
      <table mkTable density="compact" headerCase="sentence">
        <caption>Services, native table</caption>
        <thead><tr><th scope="col">Name</th><th scope="col">Version</th></tr></thead>
        <tbody>
          @for (r of rows; track r.id) {
            <tr><th scope="row">{{ r.name }}</th><td>{{ r.version }}</td></tr>
          }
        </tbody>
      </table>
    `,
  }),
};

export const Sortable: StoryObj = {
  render: () => ({
    props: {
      columns: CATALOGUE_COLUMNS,
      sort: { key: 'name', direction: 'ascending' } as SortState,
      rows: sortRows(CATALOGUE_ROWS, { key: 'name', direction: 'ascending' }),
      onSort(this: { sort: SortState | undefined; rows: CatalogueRow[] }, s: SortState | undefined) {
        this.sort = s;
        this.rows = sortRows(CATALOGUE_ROWS, s);
      },
    },
    template: `
<mk-data-table caption="Services, sortable" [columns]="columns" [rows]="rows" rowKey="id" [sort]="sort" (sortChange)="onSort($event)" />
    `,
  }),
};

export const RowLinks: StoryObj = {
  name: "Row links",
  render: () => ({
    props: { columns: CATALOGUE_COLUMNS, rows: CATALOGUE_ROWS, href: (r: CatalogueRow) => `#/services/${r.id}` },
    template: `
<mk-data-table caption="Services" [columns]="columns" [rows]="rows" rowKey="id" [rowHref]="href" selectedKey="pastry" />
    `,
  }),
};

export const Compact: StoryObj = {
  render: () => ({
    props: { columns: CATALOGUE_COLUMNS, rows: CATALOGUE_ROWS },
    template: `
<mk-data-table caption="Services, compact" captionHidden density="compact" [columns]="columns" [rows]="rows" rowKey="id" />
    `,
  }),
};

export const Empty: StoryObj = {
  render: () => ({
    props: { columns: CATALOGUE_COLUMNS },
    template: `
<mk-data-table caption="Services" [columns]="columns" [rows]="[]" rowKey="id" emptyText="No service matches this filter." />
    `,
  }),
};

export const HiddenHeader: StoryObj = {
  name: "Hidden column header",
  render: () => ({
    props: { columns: [...CATALOGUE_COLUMNS, { key: 'id', header: 'Identifier', headerHidden: true, mono: true }], rows: CATALOGUE_ROWS },
    template: `<mk-data-table caption="Services" [columns]="columns" [rows]="rows" rowKey="id" />`,
  }),
};

export const SentenceCase: StoryObj = {
  name: "Sentence-case headers, row headers and row tones",
  render: () => ({
    props: {
      columns: [{ key: 'run', header: 'Run', mono: true, rowHeader: true }, { key: 'result', header: 'Result' }, { key: 'duration', header: 'Duration', align: 'end' }],
      rows: [
        { id: '16', run: '#16', result: 'Failed · step updatePrice', duration: '1.42 s' },
        { id: '15', run: '#15', result: 'Passed', duration: '0.98 s' },
        { id: '14', run: '#14', result: 'Idle · never run against implementations', duration: '—' },
      ],
      tone: (r: { result: string }) => (r.result.startsWith('Failed') ? 'danger' : r.result.startsWith('Idle') ? 'idle' : undefined),
    },
    template: `
<mk-data-table caption="Workflow runs" headerCase="sentence" [columns]="columns" [rows]="rows" rowKey="id" [rowTone]="tone" />
    `,
  }),
};

/** `layout="fixed"` with column `width`, `[scroll]="false"` (no region, no tab stop) and `selectable`: the row header is a toggle button with `aria-pressed`; `(rowSelect)` emits the row. */
export const SelectableRowHeader: StoryObj = {
  name: 'Fixed layout, no scroll region, selectable row header',
  render: () => ({
    props: {
      columns: [
        { key: 'id', header: 'Task', mono: true, rowHeader: true, width: '116px' },
        { key: 'skill', header: 'Skill' },
        { key: 'updated', header: 'Updated', align: 'end', width: '100px' },
      ],
      rows: [
        { id: 'task-7f3a', skill: 'restock-pastry', updated: 'now' },
        { id: 'task-41c2', skill: 'compare-prices', updated: '2 min ago' },
        { id: 'task-09be', skill: '— no match', updated: '1 h ago' },
      ],
      selected: 'task-7f3a',
    },
    template: `
<mk-data-table caption="Tasks" layout="fixed" [scroll]="false" selectable [columns]="columns" [rows]="rows" rowKey="id" [selectedKey]="selected" (rowSelect)="selected = $event.id" />
    `,
  }),
};

/** Interactive: the inputs of the component are controls in the Controls panel. */
export const Playground: StoryObj = playground('table', 'DataTableComponent', {
  caption: 'Services',
  captionHidden: false,
  columns: CATALOGUE_COLUMNS,
  rows: CATALOGUE_ROWS,
  rowKey: 'id',
  density: 'comfortable',
  headerCase: 'upper',
  emptyText: 'No service matches.',
  scroll: true,
  layout: 'auto',
});
