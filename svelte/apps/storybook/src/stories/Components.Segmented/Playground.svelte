<script lang="ts">
  import { Segmented } from '@microcks/deep-ink';
  import { untrack } from 'svelte';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof Segmented> = $props();
  let value = $state(untrack(() => args.value));
  $effect(() => { value = args.value; });
</script>

<Segmented {...args} value={value} onchange={(value) => (value = value)} />
