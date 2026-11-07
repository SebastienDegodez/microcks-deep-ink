<script lang="ts">
  import type { SummaryStripSepProps } from './types.js';
  let { class: className, ...rest }: SummaryStripSepProps = $props();
</script>

<span {...rest} class={['summary-strip-sep', className]} aria-hidden="true"></span>
