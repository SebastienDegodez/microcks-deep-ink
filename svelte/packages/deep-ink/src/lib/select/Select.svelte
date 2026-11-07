<!--
  Native <select> (registry item select). Same props as the React Select: size, className plus any <select> attribute;
  `value` is bindable, the options are the children. The browser provides the keyboard behavior and the picker.
  Give it a visible label with Field (or a <label for>).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLSelectAttributes } from 'svelte/elements';

  type Props = Omit<HTMLSelectAttributes, 'class' | 'size' | 'children'> & {
    size?: 'md' | 'sm';
    className?: string;
    children?: Snippet;
  };

  let { size = 'md', className, value = $bindable(), children, ...rest }: Props = $props();
</script>

<select bind:value {...rest} class={['select', className].filter(Boolean).join(' ')} data-size={size}>
  {@render children?.()}
</select>
