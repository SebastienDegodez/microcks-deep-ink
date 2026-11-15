<script lang="ts">
  import { DataTable } from '@microcks/deep-ink';
  import { CATALOGUE_COLUMNS, CATALOGUE_ROWS } from '@microcks-deep-ink/storybook-shared/fixtures';
</script>

<DataTable caption="Services, router links" columns={CATALOGUE_COLUMNS} rows={CATALOGUE_ROWS.slice(0, 3)} rowKey="id" rowHref={(r) => `#/services/${r.id}`}>{#snippet renderRowLink(r, props)}<a {...props} data-route={r.id}>{@render props.children()}</a>{/snippet}</DataTable>
