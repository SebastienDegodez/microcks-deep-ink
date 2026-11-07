<!--
  Grid of key figures (registry item stat-card), each card at least 220px wide. Same props as the React StatGrid:
  label, className plus any <section> attribute and React handler (onClick...). The cards are the children.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> &
    ReactHandlers<HTMLElement> & {
    /** Accessible name of the group: "Key figures". */
    label: string;
    className?: string;
    children?: Snippet;
  };

  let { label, className, children, ...rest }: Props = $props();
</script>

<section {...reactEvents(rest)} aria-label={label} class={['stat-grid', className].filter(Boolean).join(' ')}>{@render children?.()}</section>
