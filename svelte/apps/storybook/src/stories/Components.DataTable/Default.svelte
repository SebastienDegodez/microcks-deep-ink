<script lang="ts">
  import { DataTable } from '@microcks/deep-ink';
  import { CATALOGUE_COLUMNS, CATALOGUE_ROWS } from '@microcks-deep-ink/storybook-shared/fixtures';
</script>

<DataTable caption="Services" columns={CATALOGUE_COLUMNS} rows={CATALOGUE_ROWS} rowKey="id" />
