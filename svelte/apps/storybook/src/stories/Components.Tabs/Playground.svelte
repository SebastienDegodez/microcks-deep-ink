<script lang="ts">
  import { TabPanel, Tabs } from '@microcks/deep-ink';
  import { untrack } from 'svelte';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof Tabs> = $props();
  let value = $state(untrack(() => args.value));
  $effect(() => { value = args.value; });
</script>

<Tabs {...args} value={value} onchange={(value) => (value = value)} />{#each args.items as i}<TabPanel id={i.id} value={value} idPrefix={args.idPrefix}><p>{i.label} panel</p></TabPanel>{/each}
