<script lang="ts">
  import { MethodTag, StatusBadge, SummaryStrip, SummaryStripSep } from '../src/lib/index.js';
  let { onclick }: { onclick: () => void } = $props();
  const attemptLabel = ' · attempt ';
</script>

{#snippet fact()}<strong>3</strong> APIs{/snippet}
<SummaryStrip parts={[{ text: 'Imported', kind: 'label' }, { text: fact, sep: true }]} role="note" aria-label="Import summary" data-native="yes">
  <SummaryStripSep title="Separator" class="extra" />
  <a href="/services">View services</a>
</SummaryStrip>
<StatusBadge status="running" label="Retrying">
  {attemptLabel}<strong>2</strong> of 3
</StatusBadge>
<StatusBadge status="failed" />
<MethodTag method="GET" onclick={onclick} title="Read operation" data-native="yes" class={['extra', { selected: true }]} style="color: red; --method-min-width: 99px" minWidth={0} />
