<script lang="ts">
  import { MethodTag, StatusBadge, LiveIndicator, SummaryStrip, SummaryStripSep, PROTOCOL_ATTR } from '@microcks/deep-ink';
  import type { SummaryStripPart, Outcome, Protocol, MethodTagProps } from '@microcks/deep-ink';
  import '@microcks/deep-ink/styles.no-fonts.css';
  const protocol: Protocol = 'REST';
  const status: Outcome = 'conformant';
  const tag: MethodTagProps = { method: 'GET', protocol, class: ['consumer', { active: true }] };
  const parts: SummaryStripPart[] = [{ text: 'Packed', kind: 'label' }, { text: '3 APIs', sep: true }];
  let clicks = $state(0);
</script>

<main>
  <h1>Standalone packed Svelte consumer</h1>
  <MethodTag {...tag} minWidth={52} onclick={() => clicks++} title={PROTOCOL_ATTR[protocol]} />
  <StatusBadge {status}>{' · verified '}<strong>natively</strong></StatusBadge>
  <LiveIndicator size="compact" pulse={false} />
  <LiveIndicator variant="dot" paused pausedLabel="paused · 2 new calls" />
  <SummaryStrip {parts} gap="roomy" values="text" lineHeight="inherit" variant="canvas" role="note" aria-label="Package smoke">
    <SummaryStripSep /><a href="#details">Details</a>
  </SummaryStrip>
  <p id="details">Clicks: {clicks}</p>
</main>
