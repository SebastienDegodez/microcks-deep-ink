<!--
  Per-operation conformance band (registry item conformance-band). Same props as the React ConformanceBand: outcomes,
  size, labels, showSummary, unit, className plus any attribute and React handler (onClick...) of the band (the
  role="img" <div>, or the <ul> when labelled), never of the summary wrapper.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from '../icon/Icon.svelte';
  import { reactEvents, type ReactHandlers } from '../react-events';
  import { conformanceLabel, type OperationResult } from './conformance-band';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> &
    ReactHandlers<HTMLElement> & {
    /** One entry per operation. */
    outcomes: OperationResult[];
    /** `full`: 12px cells; `mini`: the 96 x 14 catalogue-row band. */
    size?: 'full' | 'mini';
    /** One visible label per cell, written under it ("GET /pastries · passed"). Full size only. */
    labels?: string[];
    /** Adds the 40px score and the counts as text under the band. Full size only. */
    showSummary?: boolean;
    /** What a segment counts, singular: `operation` (default) or `skill` for an A2A agent. */
    unit?: string;
    className?: string;
  };

  let { outcomes, size = 'full', unit = 'operation', labels, showSummary, className, ...rest }: Props = $props();

  const RESULT_ICON = { pass: 'check', fail: 'cross', untested: 'circle' } as const;
  const label = $derived(conformanceLabel(outcomes, unit));
  const score = $derived(outcomes.length ? Math.round((outcomes.filter((o) => o === 'pass').length / outcomes.length) * 100) : 0);
  const level = $derived(score >= 80 ? 'high' : score >= 50 ? 'mid' : 'low');
  const cls = $derived(['conformance', className].filter(Boolean).join(' '));
  const labelled = $derived(size !== 'mini' && labels !== undefined);
</script>

{#snippet band()}{#if labelled}<ul {...reactEvents(rest)} class={cls} data-size={size} data-labelled="" aria-label={label}
      >{#each outcomes as result, i (i)}<li data-result={result}
          ><span class="conformance-bar" aria-hidden="true"></span><span class="conformance-label"
            ><Icon name={RESULT_ICON[result]} size={12} />{labels?.[i]}</span
          ></li
        >{/each}</ul
    >{:else}<div {...reactEvents(rest)} class={cls} data-size={size} role="img" aria-label={label}
      >{#each outcomes as result, i (i)}<span data-result={result}></span>{/each}</div
    >{/if}{/snippet}

{#if size !== 'mini' && showSummary}<div class="conformance-wrap"
    >{@render band()}<!-- Visible summary, outside the role="img" so assistive technology reads it as text too. --><p
      class="conformance-summary"
      ><span class="conformance-score" data-level={level}>{score}%</span><span>{label}</span></p
    ></div
  >{:else}{@render band()}{/if}
