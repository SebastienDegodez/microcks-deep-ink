<!--
  Native <textarea> with the same styling as Input. Same props as the React Textarea, with the same defaultValue and
  React handlers (onChange on every keystroke, onInput, onFocus, onBlur) as Input; `value` is bindable.
-->
<script lang="ts">
  import type { FocusEventHandler, FormEventHandler, HTMLTextareaAttributes } from 'svelte/elements';

  type Props = Omit<HTMLTextareaAttributes, 'class' | 'children'> & {
    mono?: boolean;
    size?: 'md' | 'sm';
    surface?: 'surface' | 'bg';
    className?: string;
    /** Initial value of an uncontrolled field. */
    defaultValue?: HTMLTextareaAttributes['value'];
    /** React name: called on every input event (not only on commit). */
    onChange?: FormEventHandler<HTMLTextAreaElement>;
    onInput?: FormEventHandler<HTMLTextAreaElement>;
    onFocus?: FocusEventHandler<HTMLTextAreaElement>;
    onBlur?: FocusEventHandler<HTMLTextAreaElement>;
  };

  let {
    mono,
    size = 'md',
    surface,
    className,
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

<textarea
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
></textarea>
