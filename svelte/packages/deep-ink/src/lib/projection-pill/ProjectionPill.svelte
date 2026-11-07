<!--
  Marks a projection, a proposed feature not available today (registry item projection-pill). Same props as the React
  ProjectionPill: title (a supplementary tooltip), children (defaults to "Projection · v2 module"), className plus any
  <span> attribute and React handler (onClick...).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> &
    ReactHandlers<HTMLSpanElement> & {
    /** Supplementary tooltip. The visible text must stand alone. */
    title?: string;
    className?: string;
    children?: Snippet;
  };

  let { className, children, ...rest }: Props = $props();
</script>

<span {...reactEvents(rest)} class={['projection-pill', className].filter(Boolean).join(' ')}
  >{#if children}{@render children()}{:else}Projection · v2 module{/if}</span
>
