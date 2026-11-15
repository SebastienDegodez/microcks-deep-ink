<script lang="ts">
  import { Stepper } from '@microcks/deep-ink';
</script>
{#snippet checkMenu()}<span class="sr-only">Step 1: </span><span style="font: 600 13px/1.3 var(--font-mono)">checkMenu</span><span style="font: 400 11px/1.4 var(--font-mono); color: var(--text-muted)">GET /pastries</span>{/snippet}
{#snippet orderPastry()}<span class="sr-only">Step 2: </span><span style="font: 600 13px/1.3 var(--font-mono)">orderPastry</span><span style="font: 400 11px/1.4 var(--font-mono); color: var(--text-muted)">POST /orders</span>{/snippet}
<section aria-labelledby="stepper-plan" style="max-width: 420px"><h3 id="stepper-plan" class="section-label">Plan</h3><Stepper variant="list" marker="circle" steps={[{ label: checkMenu }, { label: orderPastry }]} /></section>
