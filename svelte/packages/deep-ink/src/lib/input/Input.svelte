<!--
  Native <input> (registry item input). Same props as the React Input: mono, size, surface, className plus any <input>
  attribute; `value` is bindable. Give it a visible label with Field (or a <label for>); a placeholder is not a label.
-->
<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  type Props = Omit<HTMLInputAttributes, 'class' | 'size' | 'children'> & {
    /** Monospaced text for paths, URLs and identifiers. */
    mono?: boolean;
    size?: 'md' | 'sm';
    /** `bg`: on the page background instead of the surface (Import). */
    surface?: 'surface' | 'bg';
    className?: string;
  };

  let { mono, size = 'md', surface, className, type = 'text', value = $bindable(), ...rest }: Props = $props();
</script>

<input
  {type}
  bind:value
  {...rest}
  class={['input', className].filter(Boolean).join(' ')}
  data-mono={mono ? '' : undefined}
  data-size={size}
  data-surface={surface === 'bg' ? 'bg' : undefined}
/>
