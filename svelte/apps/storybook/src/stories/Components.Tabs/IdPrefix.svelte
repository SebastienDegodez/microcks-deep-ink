<script lang="ts">
  import { TabPanel, Tabs } from '@microcks/deep-ink';
  import { SERVICE_TABS } from '@microcks-deep-ink/storybook-shared/fixtures';
  let a = $state('operations');
  let b = $state('operations');
</script>

<div class="sb-col"><Tabs label="Service A" idPrefix="a" items={SERVICE_TABS} value={a} onchange={(value) => (a = value)}><TabPanel id={a} value={a} idPrefix="a"><p style="margin:0">Service A, {a}.</p></TabPanel></Tabs><Tabs label="Service B" idPrefix="b" variant="card" items={SERVICE_TABS} value={b} onchange={(value) => (b = value)}><TabPanel id={b} value={b} idPrefix="b"><p style="margin:0">Service B, {b}.</p></TabPanel></Tabs></div>
