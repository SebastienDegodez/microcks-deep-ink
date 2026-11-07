<!--
  Decorative placeholder (registry item skeleton). Same props as the React Skeleton: lines, width, className plus any
  <span> attribute and React handler (onClick...). Hidden from assistive technology: set aria-busy="true" on the container that is loading and
  announce completion with a live region.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> &
    ReactHandlers<HTMLSpanElement> & {
    /** Number of text-like lines. */
    lines?: number;
    width?: string | number;
    className?: string;
  };

  let { lines = 1, width, className, style, ...rest }: Props = $props();

  const vars = $derived(width === undefined ? '' : `--skeleton-width: ${typeof width === 'number' ? `${width}px` : width};`);
  const css = $derived([vars, style].filter(Boolean).join(' ') || undefined);
</script>

{#if lines <= 1}
  <span {...reactEvents(rest)} aria-hidden="true" class={['skeleton', className].filter(Boolean).join(' ')} style={css}></span>
{:else}
  <span {...reactEvents(rest)} aria-hidden="true" class={['skeleton-group', className].filter(Boolean).join(' ')} style={css}>
    {#each { length: lines }, i (i)}<span class="skeleton"></span>{/each}
  </span>
{/if}
