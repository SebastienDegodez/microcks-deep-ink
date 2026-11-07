<script lang="ts">
  import { SummaryStrip, SummaryStripSep } from '@microcks/deep-ink';
  import type { SummaryStripProps } from '@microcks/deep-ink';
  let { parts: _parts, children: _children, ...rest }: SummaryStripProps = $props();
</script>

<SummaryStrip role="note" aria-label="Import summary" {...rest}>
  <span class="summary-strip-label">Imported</span>
  <span class="summary-strip-value"><strong>3</strong> APIs</span>
  <SummaryStripSep />
  <a href="#services">View services</a>
</SummaryStrip>
