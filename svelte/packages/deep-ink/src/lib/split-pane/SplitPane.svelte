<script lang="ts">
  import type { SplitPaneProps } from './types.js';
  import { withVars } from '../internal/style.js';
  let { sideWidth, sideMax, mainWidth, gap, align = 'start', balanced, keepSideMax, class: cssClass, style, children, ...rest }: SplitPaneProps = $props();
  const css = $derived(withVars({ '--split-side': sideWidth, '--split-side-max': sideMax, '--split-main': mainWidth, '--split-gap': gap }, style));
</script>
<div {...rest} class={['split-pane', cssClass]} data-align={align === 'stretch' ? 'stretch' : undefined} data-balanced={balanced ? '' : undefined} data-keep-side-max={keepSideMax ? '' : undefined} style={css}>{@render children?.()}</div>
