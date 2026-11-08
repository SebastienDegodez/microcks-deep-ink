<script lang="ts">
  import { Menu } from '@microcks/deep-ink';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof Menu> = $props();
</script>

<div style="min-height:200px"><Menu {...args} /></div>
