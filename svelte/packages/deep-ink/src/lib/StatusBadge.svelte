<script lang="ts">
  import type { Outcome, StatusBadgeProps } from './types.js';
  import { OUTCOME_WORD } from './contracts.js';
  import Glyph from './internal/Glyph.svelte';
  let { status, label, size = 'md', shape = 'circled', children, class: cssClass, ...rest }: StatusBadgeProps = $props();
  const icons = {
    circled: { conformant: 'check-circle', failed: 'x-circle', partial: 'warning', running: 'running', never: 'never-tested' },
    bare: { conformant: 'check', failed: 'cross', partial: 'warning', running: 'running', never: 'circle' },
  } as const;
  let known = $derived(Object.hasOwn(OUTCOME_WORD, status) ? status : 'never' as Outcome);
  let iconSize = $derived(size === 'lg' ? 15 : shape === 'circled' ? (size === 'sm' ? 14 : 15) : size === 'sm' ? 13 : 14);
</script>

<span {...rest} class={['status', cssClass]} data-status={status} data-size={size} data-shape={shape}
  ><Glyph name={icons[shape][known]} size={iconSize} /><span
    >{#if typeof label === 'function'}{@render label()}{:else}{label?.trim() ? label : OUTCOME_WORD[known]}{/if}{@render children?.()}</span
  ></span
>
