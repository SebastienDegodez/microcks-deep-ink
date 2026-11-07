<!--
  Native <input> (registry item input). Same props as the React Input: mono, size, surface, className, defaultValue and
  the React handlers onChange (on every keystroke, like React), onInput, onFocus, onBlur, plus any <input> attribute;
  `value` is bindable and starts at `defaultValue` when not given. Give it a visible label with Field (or a
  <label for>); a placeholder is not a label.
-->
<script lang="ts">
  import type { FocusEventHandler, FormEventHandler, HTMLInputAttributes } from 'svelte/elements';

  type Props = Omit<HTMLInputAttributes, 'class' | 'size' | 'children'> & {
    /** Monospaced text for paths, URLs and identifiers. */
    mono?: boolean;
    size?: 'md' | 'sm';
    /** `bg`: on the page background instead of the surface (Import). */
    surface?: 'surface' | 'bg';
    className?: string;
    /** Initial value of an uncontrolled field. */
    defaultValue?: HTMLInputAttributes['value'];
    /** React name: called on every input event (not only on commit). */
    onChange?: FormEventHandler<HTMLInputElement>;
    onInput?: FormEventHandler<HTMLInputElement>;
    onFocus?: FocusEventHandler<HTMLInputElement>;
    onBlur?: FocusEventHandler<HTMLInputElement>;
  };

  let {
    mono,
    size = 'md',
    surface,
    className,
    type = 'text',
    defaultValue,
    value = $bindable(defaultValue),
    onChange,
    onInput,
    onFocus,
    onBlur,
    oninput,
    onfocus,
    onblur,
    ...rest
  }: Props = $props();
</script>

<input
  {type}
  bind:value
  {...rest}
  oninput={(e) => {
    oninput?.(e);
    onInput?.(e);
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
  class={['input', className].filter(Boolean).join(' ')}
  data-mono={mono ? '' : undefined}
  data-size={size}
  data-surface={surface === 'bg' ? 'bg' : undefined}
/>
