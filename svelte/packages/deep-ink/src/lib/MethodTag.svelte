<script lang="ts">
  import type { MethodTagProps } from './types.js';
  import { PROTOCOL_ATTR } from './contracts.js';
  let { method, protocol = 'REST', minWidth, size = 'md', class: cssClass, style, ...rest }: MethodTagProps = $props();
</script>

<span {...rest} class={['method', cssClass]} data-method={method} data-protocol={PROTOCOL_ATTR[protocol]} data-size={size === 'md' ? undefined : size} style={minWidth ? [style, `--method-min-width: ${minWidth}px`].filter(Boolean).join(';') : style}>{method}</span>
