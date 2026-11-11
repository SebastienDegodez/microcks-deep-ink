
<script lang="ts">
  import type { FormEventHandler, HTMLInputAttributes } from 'svelte/elements';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLInputAttributes, 'class' | 'size' | 'children'> &
    Omit<NativeHandlers<HTMLInputElement>, 'onchange' | 'oninput'> & {
    /** Monospaced text for paths, URLs and identifiers. */
    mono?: boolean;
    size?: 'md' | 'sm';
    /** `bg`: on the page background instead of the surface (Import). */
    surface?: 'surface' | 'bg';
    class?: string;
    /** Initial value of an uncontrolled field. */
    defaultValue?: HTMLInputAttributes['value'];
    oninput?: FormEventHandler<HTMLInputElement>;
    /** Native DOM reference via bind:element (to move focus to the field). */
    element?: HTMLInputElement;
  };

  let {
    mono,
    size = 'md',
    surface,
    class: cssClass,
    type = 'text',
    defaultValue,
    value = $bindable(defaultValue),
    element = $bindable(),
    ...rest
  }: Props = $props();
</script>

<input
  bind:this={element}
  {type}
  bind:value
  {...eventProps(rest)}
  class={['input', cssClass].filter(Boolean).join(' ')}
  data-mono={mono ? '' : undefined}
  data-size={size}
  data-surface={surface === 'bg' ? 'bg' : undefined}
/>
