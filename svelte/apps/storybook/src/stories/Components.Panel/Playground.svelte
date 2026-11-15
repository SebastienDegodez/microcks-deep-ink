<script lang="ts">
  import { Panel } from '@microcks/deep-ink';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof Panel> = $props();
</script>

<Panel {...args} />
