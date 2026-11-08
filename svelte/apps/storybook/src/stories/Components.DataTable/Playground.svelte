<script lang="ts">
  import { DataTable } from '@microcks/deep-ink';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof DataTable> = $props();
</script>

<DataTable {...args} />
