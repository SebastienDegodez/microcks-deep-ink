<script lang="ts">
  import { TabPanel, Tabs } from '@microcks/deep-ink';
  import { SERVICE_TABS } from '@microcks-deep-ink/storybook-shared/fixtures';
  let v = $state('operations');
  const items = SERVICE_TABS.map((t) => (t.id === 'contracts' ? { ...t, disabled: true } : t));
</script>

<Tabs label="Service sections" items={items} value={v} onchange={(value) => (v = value)}><TabPanel id={v} value={v}><p style="margin:0">Arrow keys skip the disabled tab.</p></TabPanel></Tabs>
