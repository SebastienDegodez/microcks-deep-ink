<script lang="ts">
  import { Skeleton } from '@microcks/deep-ink';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof Skeleton> = $props();
</script>

<Skeleton {...args} />
