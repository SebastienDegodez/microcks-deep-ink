<script lang="ts">
  import { Progress } from '@microcks/deep-ink';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof Progress> = $props();
</script>

<Progress {...args} />
