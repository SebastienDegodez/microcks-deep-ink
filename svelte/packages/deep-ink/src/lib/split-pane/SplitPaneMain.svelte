<script lang="ts">
  import type { SplitPanePaneProps } from './types.js';
  let { as = 'div', class: cssClass, children, ...rest }: SplitPanePaneProps = $props();
</script>
<svelte:element this={as} {...rest} class={['split-pane-main', cssClass]}>{@render children?.()}</svelte:element>
