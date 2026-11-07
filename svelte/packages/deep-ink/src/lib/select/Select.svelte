<!--
  Native <select> (registry item select). Same props as the React Select: size, className, defaultValue and the React
  handlers onChange, onFocus, onBlur, plus any <select> attribute; `value` is bindable and starts at `defaultValue`
  when not given; the options are the children. The browser provides the keyboard behavior and the picker.
  Give it a visible label with Field (or a <label for>).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ChangeEventHandler, FocusEventHandler, HTMLSelectAttributes } from 'svelte/elements';

  type Props = Omit<HTMLSelectAttributes, 'class' | 'size' | 'children'> & {
    size?: 'md' | 'sm';
    className?: string;
    /** Initial value of an uncontrolled select. */
    defaultValue?: HTMLSelectAttributes['value'];
    onChange?: ChangeEventHandler<HTMLSelectElement>;
    onFocus?: FocusEventHandler<HTMLSelectElement>;
    onBlur?: FocusEventHandler<HTMLSelectElement>;
    children?: Snippet;
  };

  let {
    size = 'md',
    className,
    defaultValue,
    value = $bindable(defaultValue),
    onChange,
    onFocus,
    onBlur,
    onchange,
    onfocus,
    onblur,
    children,
    ...rest
  }: Props = $props();
</script>

<select
  bind:value
  {...rest}
  onchange={(e) => {
    onchange?.(e);
    onChange?.(e);
  }}
  onfocus={(e) => {
    onfocus?.(e);
    onFocus?.(e);
  }}
  onblur={(e) => {
    onblur?.(e);
    onBlur?.(e);
  }}
  class={['select', className].filter(Boolean).join(' ')}
  data-size={size}
>
  {@render children?.()}
</select>
