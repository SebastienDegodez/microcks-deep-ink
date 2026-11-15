<script lang="ts">
  import { CommandBar } from '@microcks/deep-ink';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof CommandBar> = $props();
</script>

<div style="max-width:560px"><CommandBar {...args} /></div>
