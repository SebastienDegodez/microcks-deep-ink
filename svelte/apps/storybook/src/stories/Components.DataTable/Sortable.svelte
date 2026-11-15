<script lang="ts">
  import { DataTable, sortRows, type SortState } from '@microcks/deep-ink';
  import { CATALOGUE_COLUMNS, CATALOGUE_ROWS } from '@microcks-deep-ink/storybook-shared/fixtures';
  let sort = $state<SortState>({ key: 'name', direction: 'ascending' });
  const rows = $derived(sortRows(CATALOGUE_ROWS, sort));
</script>

<DataTable caption="Services, sortable" columns={CATALOGUE_COLUMNS} rows={rows} rowKey="id" sort={sort} onsortchange={(value) => (sort = value)} />
