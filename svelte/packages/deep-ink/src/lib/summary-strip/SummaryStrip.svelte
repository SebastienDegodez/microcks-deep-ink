<!--
  Key facts in one bordered row with decorative separators (registry item summary-strip). Same props as the React
  SummaryStrip: parts, gap, values, variant, className plus any <div> attribute and React handler (onClick...). A
  part's `text` (ReactNode in React) is a string or a snippet; free content after the parts is the children. Pass
  `role="note"` and `aria-label` for a page summary.
-->
<script lang="ts" module>
  import type { Snippet } from 'svelte';

  export interface SummaryStripPart {
    text: string | number | Snippet;
    /** `value` (default): mono --text-secondary. `label`: muted sans. */
    kind?: 'value' | 'label';
    /** Draws a separator before this part. */
    sep?: boolean;
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> &
    ReactHandlers<HTMLDivElement> & {
    parts?: SummaryStripPart[];
    /** `roomy`: 10px between wrapped rows. */
    gap?: 'normal' | 'roomy';
    /** `text`: values in --text instead of --text-secondary. */
    values?: 'secondary' | 'text';
    /** `canvas`: the --canvas fill, radius 8, padding 10px 14px. Default `default`. */
    variant?: 'default' | 'canvas';
    className?: string;
    children?: Snippet;
  };

  let { parts = [], gap = 'normal', values = 'secondary', variant = 'default', className, children, ...rest }: Props = $props();
</script>

<div
  {...reactEvents(rest)}
  class={['summary-strip', className].filter(Boolean).join(' ')}
  data-gap={gap === 'roomy' ? 'roomy' : undefined}
  data-values={values === 'text' ? 'text' : undefined}
  data-variant={variant === 'default' ? undefined : variant}
  >{#each parts as p, i (i)}{#if p.sep}<span class="summary-strip-sep" aria-hidden="true"></span>{/if}<span
      class={p.kind === 'label' ? 'summary-strip-label' : 'summary-strip-value'}
      >{#if typeof p.text === 'function'}{@render p.text()}{:else}{p.text}{/if}</span
    >{/each}{@render children?.()}</div
>
