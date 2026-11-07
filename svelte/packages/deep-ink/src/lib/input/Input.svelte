<!--
  Native <input> (registry item input). Same props as the React Input: mono, size, surface, className, defaultValue and
  any React handler (onChange on every keystroke, like React; onInput, onKeyDown, onFocus...), plus any <input> attribute;
  `value` is bindable and starts at `defaultValue` when not given. Give it a visible label with Field (or a
  <label for>); a placeholder is not a label.
-->
<script lang="ts">
  import type { FormEventHandler, HTMLInputAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLInputAttributes, 'class' | 'size' | 'children'> &
    Omit<ReactHandlers<HTMLInputElement>, 'onChange' | 'onInput'> & {
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
    oninput,
    ...rest
  }: Props = $props();
</script>

<input
  {type}
  bind:value
  {...reactEvents(rest)}
  oninput={(e) => {
    oninput?.(e);
    onInput?.(e);
    onChange?.(e);
  }}
  class={['input', className].filter(Boolean).join(' ')}
  data-mono={mono ? '' : undefined}
  data-size={size}
  data-surface={surface === 'bg' ? 'bg' : undefined}
/>
