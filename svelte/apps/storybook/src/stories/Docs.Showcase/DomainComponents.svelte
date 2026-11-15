<script lang="ts">
  import { StatCard, OperationList, OperationRow, MockUrl } from '@microcks/deep-ink';
  import { MOCK_BASE, OPERATIONS } from '@microcks-deep-ink/storybook-shared/fixtures';
  import Frame from './Frame.svelte';
  let selected = $state(1);
</script>
<Frame label="Domain components">
  <div class="inline" style:align-items="stretch"><StatCard headingLevel={3} title="Mock invocations · 7 days" value="638" unit="requests" /><StatCard headingLevel={3} title="Conformance" value="92 %" tone="success" unit="29 operations" /></div>
  <div style:max-width="720px"><OperationList label="Operations of API Pastry 2.0">{#each OPERATIONS as op, i (`${op.method}${op.path}`)}<OperationRow {...op} selected={selected === i} onselect={() => { selected = i; }} />{/each}</OperationList></div>
  <div style:max-width="720px"><MockUrl url={`${MOCK_BASE}/pastries/Millefeuille`} mcpTool="getPastry" /></div>
</Frame>
