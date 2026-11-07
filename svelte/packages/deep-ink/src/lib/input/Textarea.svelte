
<script lang="ts">
  import type { FormEventHandler, HTMLTextareaAttributes } from 'svelte/elements';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLTextareaAttributes, 'class' | 'children'> &
    Omit<NativeHandlers<HTMLTextAreaElement>, 'onchange' | 'oninput'> & {
    mono?: boolean;
    size?: 'md' | 'sm';
    surface?: 'surface' | 'bg';
    class?: string;
    /** Initial value of an uncontrolled field. */
    defaultValue?: HTMLTextareaAttributes['value'];
    oninput?: FormEventHandler<HTMLTextAreaElement>;
  };

  let {
    mono,
    size = 'md',
    surface,
    class: cssClass,
    defaultValue,
    value = $bindable(defaultValue),
    ...rest
  }: Props = $props();
</script>

<textarea
  bind:value
  {...eventProps(rest)}
  class={['input', cssClass].filter(Boolean).join(' ')}
  data-mono={mono ? '' : undefined}
  data-size={size}
  data-surface={surface === 'bg' ? 'bg' : undefined}
></textarea>
