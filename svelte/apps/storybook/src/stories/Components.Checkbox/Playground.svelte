<script lang="ts">
  import { Checkbox } from '@microcks/deep-ink';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof Checkbox> = $props();
</script>

<Checkbox {...args} />
