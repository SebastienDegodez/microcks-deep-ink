<script lang="ts">
  import type { SummaryStripProps } from './types.js';
  import SummaryStripSep from './SummaryStripSep.svelte';
  let { parts = [], gap = 'normal', values = 'secondary', variant = 'default', lineHeight = 'fixed', children, class: className, ...rest }: SummaryStripProps = $props();
</script>

<div {...rest} class={['summary-strip', className]} data-gap={gap === 'roomy' ? 'roomy' : undefined} data-values={values === 'text' ? 'text' : undefined} data-variant={variant === 'default' ? undefined : variant} data-line-height={lineHeight === 'inherit' ? 'inherit' : undefined}>
  {#each parts as part}
    {#if part.sep}<SummaryStripSep />{/if}
    <span class={part.kind === 'label' ? 'summary-strip-label' : 'summary-strip-value'}>
      {#if typeof part.text === 'string'}{part.text}{:else}{@render part.text()}{/if}
    </span>
  {/each}
  {@render children?.()}
</div>
