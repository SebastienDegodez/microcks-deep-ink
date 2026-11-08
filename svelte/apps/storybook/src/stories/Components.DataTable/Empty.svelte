<script lang="ts">
  import { DataTable } from '@microcks/deep-ink';
  import { CATALOGUE_COLUMNS } from '@microcks-deep-ink/storybook-shared/fixtures';
</script>

<DataTable caption="Services" columns={CATALOGUE_COLUMNS} rows={[]} rowKey="id" emptyText="No service matches this filter." />
