
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLSelectAttributes } from 'svelte/elements';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLSelectAttributes, 'class' | 'size' | 'children'> &
    NativeHandlers<HTMLSelectElement> & {
    size?: 'md' | 'sm';
    class?: string;
    /** Initial value of an uncontrolled select. */
    defaultValue?: HTMLSelectAttributes['value'];
    children?: Snippet;
  };

  let {
    size = 'md',
    class: cssClass,
    defaultValue,
    value = $bindable(defaultValue),
    children,
    ...rest
  }: Props = $props();
</script>

<select
  bind:value
  {...eventProps(rest)}
  class={['select', cssClass].filter(Boolean).join(' ')}
  data-size={size}
>
  {@render children?.()}
</select>
