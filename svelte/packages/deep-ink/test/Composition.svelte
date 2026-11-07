<script lang="ts">
  import { MethodTag, StatusBadge, SummaryStrip, SummaryStripSep } from '../src/lib/index.js';
  let { onClick }: { onClick: () => void } = $props();
</script>

{#snippet fact()}<strong>3</strong> APIs{/snippet}
<SummaryStrip parts={[{ text: 'Imported', kind: 'label' }, { text: fact, sep: true }]} role="note" aria-label="Import summary" data-native="yes">
  <SummaryStripSep title="Separator" class="extra" />
  <a href="/services">View services</a>
</SummaryStrip>
<StatusBadge status="running" label="Retrying">
  {' · attempt '}<strong>2</strong> of 3
</StatusBadge>
<StatusBadge status="failed">{#snippet children()}{/snippet}</StatusBadge>
<MethodTag method="GET" onclick={onClick} title="Read operation" data-native="yes" class={['extra', { selected: true }]} style="color: red; --method-min-width: 99px" minWidth={0} />
