<!--
  Native <button> with the button styling (registry item button). Same props as the React Button: variant, size, tone,
  confirm, icon, iconOnly, loading, className, type (default "button") plus any <button> attribute, and the React
  handlers (onClick, onKeyDown, onFocus...), forwarded like any other attribute. React's `ref` is `bind:element` here.
  React's `asChild` has no Svelte equivalent: use ButtonLink for navigation.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import Icon from '../icon/Icon.svelte';
  import { reactEvents, type ReactHandlers } from '../react-events';
  import type { IconName } from '../icon/Icon.svelte';
  import { iconSize, requireName, type ButtonSize, type ButtonVariant } from './button';

  type Props = Omit<HTMLButtonAttributes, 'class' | 'children'> &
    ReactHandlers<HTMLButtonElement> & {
    /** One primary per task region. `link` is a small text button (Copy, Clear list); `dashed` an add / try action. */
    variant?: ButtonVariant;
    /** `md` is 40px high. `sm` 32px and `compact` 34px (never the primary action of a page); `tile` 36px; `lg` 44px. */
    size?: ButtonSize;
    /** `danger` (ghost and link only): the text in the danger colour (an inline Delete). */
    tone?: 'danger';
    /** Filled danger, only inside a confirmation dialog. Use with `variant="danger"`. */
    confirm?: boolean;
    /** Leading icon name. */
    icon?: IconName;
    /** Icon-only button. Requires an accessible name (`aria-label`). */
    iconOnly?: boolean;
    /** Sets `aria-busy` and disables the button. */
    loading?: boolean;
    className?: string;
    element?: HTMLButtonElement;
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
    disabled,
    type = 'button',
    element = $bindable(),
    children,
    ...rest
  }: Props = $props();

  $effect.pre(() => requireName('Button', iconOnly, rest));
</script>

<button
  bind:this={element}
  {type}
  disabled={disabled || loading}
  {...reactEvents(rest)}
  class={['button', className].filter(Boolean).join(' ')}
  data-variant={variant}
  data-size={size}
  data-confirm={confirm ? '' : undefined}
  data-tone={tone}
  data-icon-only={iconOnly ? '' : undefined}
  aria-busy={loading ? true : undefined}
  >{#if icon}<Icon name={icon} size={iconSize(size, variant)} />{/if}{@render children?.()}</button
>
