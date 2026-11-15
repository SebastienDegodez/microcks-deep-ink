<script lang="ts">
  import { RadioGroup } from '@microcks/deep-ink';
  import { untrack } from 'svelte';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof RadioGroup> = $props();
  let value = $state<string | undefined>(untrack(() => args.value));
  $effect(() => { value = args.value; });
</script>

<RadioGroup {...args} value={value} onchange={(value) => (value = value)} />
