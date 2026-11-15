
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> &
    NativeHandlers<HTMLSpanElement> & {
    /** Number of text-like lines. */
    lines?: number;
    width?: string | number;
    class?: string;
  };

  let { lines = 1, width, class: cssClass, style, ...rest }: Props = $props();

  const vars = $derived(width === undefined ? '' : `--skeleton-width: ${typeof width === 'number' ? `${width}px` : width};`);
  const css = $derived([vars, style].filter(Boolean).join(' ') || undefined);
</script>

{#if lines <= 1}
  <span {...eventProps(rest)} aria-hidden="true" class={['skeleton', cssClass].filter(Boolean).join(' ')} style={css}></span>
{:else}
  <span {...eventProps(rest)} aria-hidden="true" class={['skeleton-group', cssClass].filter(Boolean).join(' ')} style={css}>
    {#each { length: lines }, i (i)}<span class="skeleton"></span>{/each}
  </span>
{/if}
