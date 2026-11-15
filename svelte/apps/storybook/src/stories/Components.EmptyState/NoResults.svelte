<script lang="ts">
  import { Button } from '@microcks/deep-ink';
  import { EmptyState } from '@microcks/deep-ink';
</script>

<EmptyState title="No service matches" icon="search-x">{#snippet actions()}<Button variant="primary" icon="reset">Reset filters</Button>{/snippet}<p>None of the 11 services matches: “zzz”. Remove a filter or reset the selection.</p></EmptyState>
