<!--
  Native <textarea> with the same styling as Input. Same props as the React Textarea, with the same defaultValue and
  React handlers (onChange on every keystroke, onInput, onKeyDown, onFocus...) as Input; `value` is bindable.
-->
<script lang="ts">
  import type { FormEventHandler, HTMLTextareaAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLTextareaAttributes, 'class' | 'children'> &
    Omit<ReactHandlers<HTMLTextAreaElement>, 'onChange' | 'onInput'> & {
    mono?: boolean;
    size?: 'md' | 'sm';
    surface?: 'surface' | 'bg';
    className?: string;
    /** Initial value of an uncontrolled field. */
    defaultValue?: HTMLTextareaAttributes['value'];
    /** React name: called on every input event (not only on commit). */
    onChange?: FormEventHandler<HTMLTextAreaElement>;
    onInput?: FormEventHandler<HTMLTextAreaElement>;
  };

  let {
    mono,
    size = 'md',
    surface,
    className,
    defaultValue,
    value = $bindable(defaultValue),
    ...rest
  }: Props = $props();
</script>

<textarea
  bind:value
  {...reactEvents(rest, { onChange: 'input' })}
  class={['input', className].filter(Boolean).join(' ')}
  data-mono={mono ? '' : undefined}
  data-size={size}
  data-surface={surface === 'bg' ? 'bg' : undefined}
></textarea>
