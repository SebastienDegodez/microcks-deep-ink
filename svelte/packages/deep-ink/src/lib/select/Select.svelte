
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

  let select: HTMLSelectElement;

  // A value that matches no option shows the first enabled option, as the twin does, where Svelte would leave the
  // select empty. The bound value stays as it is and no event is dispatched.
  function showFirstEnabled(current: unknown) {
    if (current == null || select.multiple || select.selectedIndex !== -1) return;
    const option = Array.from(select.options).find((o) => !o.disabled);
    if (option) option.selected = true;
  }

  $effect(() => showFirstEnabled(value));

  $effect(() => {
    // Runs after Svelte's own observer, which re-selects the bound value when the options change.
    const observer = new MutationObserver(() => queueMicrotask(() => showFirstEnabled(value)));
    observer.observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] });
    return () => observer.disconnect();
  });
</script>

<select
  bind:this={select}
  bind:value
  {...eventProps(rest)}
  class={['select', cssClass].filter(Boolean).join(' ')}
  data-size={size}
>
  {@render children?.()}
</select>
