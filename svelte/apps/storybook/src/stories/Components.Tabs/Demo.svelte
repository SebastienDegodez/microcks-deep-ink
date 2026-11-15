<script lang="ts">
  import { TabPanel, Tabs } from '@microcks/deep-ink';
  import { SERVICE_TABS } from '@microcks-deep-ink/storybook-shared/fixtures';
  let { activation }: { activation: 'automatic' | 'manual' } = $props();
  let v = $state('operations');
</script>

<Tabs label="Service sections" items={SERVICE_TABS} value={v} onchange={(value) => (v = value)} activation={activation}>{#each SERVICE_TABS as t}<TabPanel id={t.id} value={v}><p style="margin:0">Content of the {t.label} tab.</p></TabPanel>{/each}</Tabs>
