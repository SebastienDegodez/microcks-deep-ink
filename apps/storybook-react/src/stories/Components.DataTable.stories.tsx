import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useMemo, useState } from 'react';
import { DataTable, sortRows, type SortState } from '@microcks-deep-ink/registry/react/table';
import { CATALOGUE_COLUMNS, CATALOGUE_ROWS, type CatalogueRow } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Components/Data table',
  parameters: itemParams(['table', 'icon'], 'A native `<table>` with a caption, `th scope="col"`, `aria-sort` on sortable headers (a real button inside) and a focusable scroll region. With `rowHref` the first cell holds a link stretched over the row: no clickable `<tr>`.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <DataTable<CatalogueRow> caption="Services" columns={CATALOGUE_COLUMNS} rows={CATALOGUE_ROWS} rowKey="id" />
  ),
};

export const Sortable: StoryObj = {
  render: () => {
    const [sort, setSort] = useState<SortState>({ key: 'name', direction: 'ascending' });
    const rows = useMemo(() => sortRows(CATALOGUE_ROWS, sort), [sort]);
    return <DataTable<CatalogueRow> caption="Services, sortable" columns={CATALOGUE_COLUMNS} rows={rows} rowKey="id" sort={sort} onSortChange={setSort} />;
  },
};

export const RowLinks: StoryObj = {
  name: 'Row links',
  render: () => (
    <DataTable<CatalogueRow> caption="Services" columns={CATALOGUE_COLUMNS} rows={CATALOGUE_ROWS} rowKey="id" rowHref={(r) => `#/services/${r.id}`} selectedKey="pastry" />
  ),
};

export const Compact: StoryObj = {
  render: () => <DataTable<CatalogueRow> caption="Services, compact" captionHidden density="compact" columns={CATALOGUE_COLUMNS} rows={CATALOGUE_ROWS} rowKey="id" />,
};

export const Empty: StoryObj = {
  render: () => <DataTable<CatalogueRow> caption="Services" columns={CATALOGUE_COLUMNS} rows={[]} rowKey="id" emptyText="No service matches this filter." />,
};

export const HiddenHeader: StoryObj = {
  name: 'Hidden column header',
  render: () => (
    <DataTable<CatalogueRow>
      caption="Services"
      columns={[...CATALOGUE_COLUMNS, { key: 'id', header: 'Identifier', headerHidden: true, mono: true }]}
      rows={CATALOGUE_ROWS}
      rowKey="id"
    />
  ),
};

type RunRow = { id: string; run: string; result: string; duration: string };
const RUN_ROWS: RunRow[] = [
  { id: '16', run: '#16', result: 'Failed · step updatePrice', duration: '1.42 s' },
  { id: '15', run: '#15', result: 'Passed', duration: '0.98 s' },
  { id: '14', run: '#14', result: 'Idle · never run against implementations', duration: '—' },
];

export const SentenceCase: StoryObj = {
  name: 'Sentence-case headers, row headers and row tones',
  render: () => (
    <DataTable<RunRow>
      caption="Workflow runs"
      headerCase="sentence"
      columns={[{ key: 'run', header: 'Run', mono: true, rowHeader: true }, { key: 'result', header: 'Result' }, { key: 'duration', header: 'Duration', align: 'end' }]}
      rows={RUN_ROWS}
      rowKey="id"
      rowTone={(r) => (r.result.startsWith('Failed') ? 'danger' : r.result.startsWith('Idle') ? 'idle' : undefined)}
    />
  ),
};
