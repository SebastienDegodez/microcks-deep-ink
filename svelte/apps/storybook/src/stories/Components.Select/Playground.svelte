<script lang="ts">
  import { Select } from '@microcks/deep-ink';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof Select> = $props();
</script>

<Select {...args} />
