<script lang="ts" module>
export { children };
</script>
<script lang="ts">
  import { Input } from '@microcks/deep-ink';
  import type { FieldControlProps } from '@microcks/deep-ink';
</script>
{#snippet children(c: FieldControlProps)}<Input {...c} defaultValue="API Pastry" />{/snippet}
