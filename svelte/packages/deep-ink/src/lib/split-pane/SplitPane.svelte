<!--
  List + detail layout (registry item split-pane). Same props as the React SplitPane: sideWidth, sideMax, mainWidth,
  gap, align, balanced, keepSideMax, className, style (a string here) plus any <div> attribute and React handler
  (onClick...). Children: a SplitPaneSide and a SplitPaneMain, in reading order.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';
  import { withVars } from '../style';

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> &
    ReactHandlers<HTMLDivElement> & {
    /** Starting width of the side pane (260px). */
    sideWidth?: string;
    /** Cap of the side pane (360px); `none` lets it grow. */
    sideMax?: string;
    /** Starting width of the main pane (520px): below side + main + gap, the main pane wraps. */
    mainWidth?: string;
    /** Gap between the panes (20px). */
    gap?: string;
    /** `stretch`: both panes as tall as the taller one. Default `start`. */
    align?: 'start' | 'stretch';
    /** Both panes grow alike instead of the main pane taking the rest. */
    balanced?: boolean;
    /** Keep the `sideMax` cap below 720px too, instead of letting the side pane fill the row. */
    keepSideMax?: boolean;
    className?: string;
    children?: Snippet;
  };

  let { sideWidth, sideMax, mainWidth, gap, align = 'start', balanced, keepSideMax, className, style, children, ...rest }: Props = $props();

  const css = $derived(withVars({ '--split-side': sideWidth, '--split-side-max': sideMax, '--split-main': mainWidth, '--split-gap': gap }, style));
</script>

<div
  {...reactEvents(rest)}
  class={['split-pane', className].filter(Boolean).join(' ')}
  data-align={align === 'stretch' ? 'stretch' : undefined}
  data-balanced={balanced ? '' : undefined}
  data-keep-side-max={keepSideMax ? '' : undefined}
  style={css}>{@render children?.()}</div
>
