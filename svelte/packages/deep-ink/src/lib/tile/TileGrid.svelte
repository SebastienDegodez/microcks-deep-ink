<!--
  Wrapping grid of tiles (registry item tile). Same props as the React TileGrid: label, as, className plus any
  attribute and React handler (onClick...) of the root; the tiles are the children.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> &
    ReactHandlers<HTMLElement> & {
    /** Accessible name of the group: "Packages". */
    label: string;
    /** `section` (default) holds `article` tiles; `ul` holds `li` tiles. */
    as?: 'section' | 'ul' | 'div';
    className?: string;
    children?: Snippet;
  };

  let { label, as = 'section', className, children, ...rest }: Props = $props();
</script>

<svelte:element
  this={as}
  {...reactEvents(rest)}
  aria-label={label}
  role={as === 'div' ? 'group' : undefined}
  class={['tile-grid', className].filter(Boolean).join(' ')}>{@render children?.()}</svelte:element
>
