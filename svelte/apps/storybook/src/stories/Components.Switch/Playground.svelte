<script lang="ts">
  import { Switch } from '@microcks/deep-ink';
  import { untrack } from 'svelte';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof Switch> = $props();
  let checked = $state(untrack(() => args.checked));
  $effect(() => { checked = args.checked; });
</script>

<Switch {...args} checked={checked} oncheckedchange={(value) => (checked = value)} />
