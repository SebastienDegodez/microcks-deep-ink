import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { DataTableComponent, CellDirective } from '@microcks-deep-ink/registry/angular/table';
import { IconComponent } from '@microcks-deep-ink/registry/angular/icon';
import { type CatalogueRow, CATALOGUE_COLUMNS, CATALOGUE_ROWS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { type SortState, sortRows } from '@microcks-deep-ink/registry/angular/table';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Data table',
  decorators: [moduleMetadata({ imports: [DataTableComponent, CellDirective, IconComponent] })],
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
