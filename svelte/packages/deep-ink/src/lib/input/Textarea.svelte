
<script lang="ts">
  import type { FormEventHandler, HTMLTextareaAttributes } from 'svelte/elements';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLTextareaAttributes, 'class' | 'children'> &
    Omit<NativeHandlers<HTMLTextAreaElement>, 'onchange' | 'oninput'> & {
    mono?: boolean;
    size?: 'md' | 'sm';
    surface?: 'surface' | 'bg';
    class?: string;
    /** Initial value of an uncontrolled field. Like a native default, it is also the element's text child. */
    defaultValue?: HTMLTextareaAttributes['value'];
    oninput?: FormEventHandler<HTMLTextAreaElement>;
    /** Native DOM reference via bind:element (to move focus to the field). */
    element?: HTMLTextAreaElement;
  };

  let {
    mono,
    size = 'md',
    surface,
    class: cssClass,
    defaultValue,
    value = $bindable(defaultValue),
    element = $bindable(),
    ...rest
  }: Props = $props();
</script>

<!-- As in the twin, the text child (the native defaultValue) is the given default, else the current value. -->
<textarea
  bind:this={element}
  bind:value
  defaultValue={defaultValue ?? value ?? ''}
  {...eventProps(rest)}
  class={['input', cssClass].filter(Boolean).join(' ')}
  data-mono={mono ? '' : undefined}
  data-size={size}
  data-surface={surface === 'bg' ? 'bg' : undefined}
></textarea>
