
<script lang="ts">
  import TabPanel from '../../src/lib/tabs/TabPanel.svelte';
  import Tabs, { type TabItem } from '../../src/lib/tabs/Tabs.svelte';

  let { items, activation, onchange }: { items: TabItem[]; activation?: 'automatic' | 'manual'; onchange?: (id: string) => void } = $props();
  let value = $state('ops');
</script>

<Tabs label="Service sections" {items} bind:value {activation} {onchange}>
  {#each items as t (t.id)}<TabPanel id={t.id} {value}>Content of {t.label}</TabPanel>{/each}
</Tabs>
