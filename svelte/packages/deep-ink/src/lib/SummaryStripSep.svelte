<script lang="ts">
  import type { SummaryStripSepProps } from './types.js';
  let { class: cssClass, ...rest }: SummaryStripSepProps = $props();
</script>

<span {...rest} class={['summary-strip-sep', cssClass]} aria-hidden="true"></span>
