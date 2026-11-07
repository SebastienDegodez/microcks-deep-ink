<!--
  The narrow pane (list, rail, filters) of a SplitPane (registry item split-pane). Same props as the React
  SplitPaneSide: as, className plus any attribute and React handler (onClick...) of the pane. Name the landmark when
  `as` is section, aside or nav.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> &
    ReactHandlers<HTMLElement> & {
    /** Element of the pane: `section`, `aside`, `nav` (name the landmark) or `div` (default). */
    as?: 'div' | 'section' | 'aside' | 'nav' | 'ul' | 'ol';
    className?: string;
    children?: Snippet;
  };

  let { as = 'div', className, children, ...rest }: Props = $props();
</script>

<svelte:element this={as} {...reactEvents(rest)} class={['split-pane-side', className].filter(Boolean).join(' ')}>{@render children?.()}</svelte:element>
