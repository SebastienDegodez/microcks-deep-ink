<!--
  Native <select> (registry item select). Same props as the React Select: size, className, defaultValue and any React
  handler (onChange, onKeyDown, onFocus...), plus any <select> attribute; `value` is bindable and starts at `defaultValue`
  when not given; the options are the children. The browser provides the keyboard behavior and the picker.
  Give it a visible label with Field (or a <label for>).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLSelectAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLSelectAttributes, 'class' | 'size' | 'children'> &
    ReactHandlers<HTMLSelectElement> & {
    size?: 'md' | 'sm';
    className?: string;
    /** Initial value of an uncontrolled select. */
    defaultValue?: HTMLSelectAttributes['value'];
    children?: Snippet;
  };

  let {
    size = 'md',
    className,
    defaultValue,
    value = $bindable(defaultValue),
    children,
    ...rest
  }: Props = $props();
</script>

<select
  bind:value
  {...reactEvents(rest)}
  class={['select', className].filter(Boolean).join(' ')}
  data-size={size}
>
  {@render children?.()}
</select>
