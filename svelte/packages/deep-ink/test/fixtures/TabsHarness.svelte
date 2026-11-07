<!-- Test-only: Tabs with their TabPanels sharing one bound value, as the React spec's Harness. -->
<script lang="ts">
  import TabPanel from '../../src/lib/tabs/TabPanel.svelte';
  import Tabs, { type TabItem } from '../../src/lib/tabs/Tabs.svelte';

  let { items, activation, onChange }: { items: TabItem[]; activation?: 'automatic' | 'manual'; onChange?: (id: string) => void } = $props();
  let value = $state('ops');
</script>

<Tabs label="Service sections" {items} bind:value {activation} {onChange}>
  {#each items as t (t.id)}<TabPanel id={t.id} {value}>Content of {t.label}</TabPanel>{/each}
</Tabs>
