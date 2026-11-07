<script lang="ts">
  import { SummaryStrip, SummaryStripSep } from '@microcks/deep-ink';
  import type { SummaryStripSepProps } from '@microcks/deep-ink';
  let props: SummaryStripSepProps = $props();
</script>

<SummaryStrip role="note" aria-label="Import summary">
  <span class="summary-strip-label">Imported</span>
  <span class="summary-strip-value">3 APIs</span>
  <SummaryStripSep {...props} />
  <a href="#services">View services</a>
</SummaryStrip>
