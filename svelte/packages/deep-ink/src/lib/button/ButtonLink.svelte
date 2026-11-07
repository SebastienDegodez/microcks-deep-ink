<!--
  Same styling as Button, on a native <a> (registry item button). Same props as the React ButtonLink: variant, size,
  tone, confirm, icon, iconOnly, loading, className plus any <a> attribute, and the React handlers onClick, onFocus,
  onBlur. Use it for navigation, Button for actions. React's `ref` is `bind:element` here.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { FocusEventHandler, HTMLAnchorAttributes, MouseEventHandler } from 'svelte/elements';
  import Icon from '../icon/Icon.svelte';
  import type { IconName } from '../icon/Icon.svelte';
  import { iconSize, requireName, type ButtonSize, type ButtonVariant } from './button';

  type Props = Omit<HTMLAnchorAttributes, 'class' | 'children'> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    tone?: 'danger';
    confirm?: boolean;
    icon?: IconName;
    /** Icon-only link. Requires an accessible name (`aria-label`). */
    iconOnly?: boolean;
    /** Sets `aria-busy`. */
    loading?: boolean;
    className?: string;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
    onFocus?: FocusEventHandler<HTMLAnchorElement>;
    onBlur?: FocusEventHandler<HTMLAnchorElement>;
    element?: HTMLAnchorElement;
    children?: Snippet;
  };

  let {
    variant = 'secondary',
    size = 'md',
    confirm,
    tone,
    icon,
    iconOnly,
    loading,
    className,
    onClick,
    onFocus,
    onBlur,
    onclick,
    onfocus,
    onblur,
    element = $bindable(),
    children,
    ...rest
  }: Props = $props();

  $effect.pre(() => requireName('ButtonLink', iconOnly, rest));
</script>

<a
  bind:this={element}
  {...rest}
  onclick={(e) => {
    onclick?.(e);
    onClick?.(e);
  }}
  onfocus={(e) => {
    onfocus?.(e);
    onFocus?.(e);
  }}
  onblur={(e) => {
    onblur?.(e);
    onBlur?.(e);
  }}
  class={['button', className].filter(Boolean).join(' ')}
  data-variant={variant}
  data-size={size}
  data-confirm={confirm ? '' : undefined}
  data-tone={tone}
  data-icon-only={iconOnly ? '' : undefined}
  aria-busy={loading ? true : undefined}
  >{#if icon}<Icon name={icon} size={iconSize(size, variant)} />{/if}{@render children?.()}</a
>
