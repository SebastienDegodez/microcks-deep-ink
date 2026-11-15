<script lang="ts">
  import type { ConformanceBandProps } from './types.js';
  import { conformanceLabel } from './model.js';
  import Icon from '../icon/Icon.svelte';
  let { outcomes, size = 'full', unit = 'operation', labels, showSummary, class: cssClass, ...rest }: ConformanceBandProps = $props();
  const label = $derived(conformanceLabel(outcomes, unit));
  const score = $derived(outcomes.length ? Math.round(outcomes.filter(o => o === 'pass').length / outcomes.length * 100) : 0);
  const level = $derived(score >= 80 ? 'high' : score >= 50 ? 'mid' : 'low');
  const icons = { pass: 'check', fail: 'cross', untested: 'circle' } as const;
</script>
{#snippet band()}
  {#if size === 'mini' || !labels}
    <div {...rest} class={['conformance', cssClass]} data-size={size} role="img" aria-label={label}>{#each outcomes as result, i (i)}<span data-result={result}></span>{/each}</div>
  {:else}
    <ul {...rest} class={['conformance', cssClass]} data-size={size} data-labelled="" aria-label={label}>{#each outcomes as result, i (i)}<li data-result={result}><span class="conformance-bar" aria-hidden="true"></span><span class="conformance-label"><Icon name={icons[result]} size={12}/>{labels[i]}</span></li>{/each}</ul>
  {/if}
{/snippet}
{#if size !== 'mini' && showSummary}<div class="conformance-wrap">{@render band()}<p class="conformance-summary"><span class="conformance-score" data-level={level}>{score}%</span><span>{label}</span></p></div>{:else}{@render band()}{/if}
