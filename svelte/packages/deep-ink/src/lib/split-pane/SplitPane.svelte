<script lang="ts">
  import type { SplitPaneProps } from './types.js';
  let { sideWidth, sideMax, mainWidth, gap, align = 'start', balanced, keepSideMax, class: cssClass, style, children, ...rest }: SplitPaneProps = $props();
  const vars = $derived([sideWidth ? `--split-side:${sideWidth}` : '', sideMax ? `--split-side-max:${sideMax}` : '', mainWidth ? `--split-main:${mainWidth}` : '', gap ? `--split-gap:${gap}` : '', style].filter(Boolean).join(';'));
</script>
<div {...rest} class={['split-pane', cssClass]} data-align={align === 'stretch' ? 'stretch' : undefined} data-balanced={balanced ? '' : undefined} data-keep-side-max={keepSideMax ? '' : undefined} style={vars}>{@render children?.()}</div>
