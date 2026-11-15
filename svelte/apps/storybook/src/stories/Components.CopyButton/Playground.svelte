<script lang="ts">
  import { CopyButton } from '@microcks/deep-ink';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof CopyButton> = $props();
</script>

<CopyButton {...args} />
