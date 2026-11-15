<script lang="ts">
  import type { ButtonProps } from './types.js';
  import ButtonIcon from './internal/ButtonIcon.svelte';
  import { buttonAttributes, iconSize } from './internal/button.js';

  let {
    variant = 'secondary', size = 'md', tone, confirm, icon, iconOnly, loading,
    class: classes, disabled, type = 'button', onclick, element = $bindable(), children, ...rest
  }: ButtonProps = $props();
  let attributes = $derived(buttonAttributes('Button', { variant, size, tone, confirm, iconOnly, loading }, rest));
</script>

<button bind:this={element} {...rest} {type} disabled={disabled || loading} class={['button', classes]} {...attributes}
  onclick={(event) => {
    if (disabled || loading) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    onclick?.(event);
  }}
>{#if icon}<ButtonIcon name={icon} size={iconSize(size, variant)} />{/if}{@render children?.()}</button>
