<script lang="ts">
  import { Input } from '@microcks/deep-ink';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof Input> = $props();
</script>

<Input {...args} />
