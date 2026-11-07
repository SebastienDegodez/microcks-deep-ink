<script lang="ts">
  import type { ButtonLinkProps } from './types.js';
  import ButtonIcon from './internal/ButtonIcon.svelte';
  import { buttonAttributes, iconSize } from './internal/button.js';

  let {
    variant = 'secondary', size = 'md', tone, confirm, icon, iconOnly, loading,
    class: classes, disabled, href, tabindex, onclick, onkeydown,
    element = $bindable(), children, ...rest
  }: ButtonLinkProps = $props();
  let inactive = $derived(Boolean(disabled || rest['aria-disabled'] === true || rest['aria-disabled'] === 'true'));
  let unavailable = $derived(Boolean(inactive || loading));
  let attributes = $derived(buttonAttributes('ButtonLink', { variant, size, tone, confirm, iconOnly, loading }, rest));
</script>

<a bind:this={element} {...rest} href={unavailable ? undefined : href} role={unavailable ? (rest.role ?? 'link') : rest.role} tabindex={unavailable ? -1 : tabindex} aria-disabled={inactive ? true : rest['aria-disabled']} class={['button', classes]} {...attributes}
  onclick={(event) => {
    if (unavailable) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    onclick?.(event);
  }}
  onkeydown={(event) => {
    if (unavailable && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); event.stopImmediatePropagation(); return;
    }
    onkeydown?.(event);
  }}
>{#if icon}<ButtonIcon name={icon} size={iconSize(size, variant)} />{/if}{@render children?.()}</a>
