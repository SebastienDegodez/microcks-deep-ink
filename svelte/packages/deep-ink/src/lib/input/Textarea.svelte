<!-- Native <textarea> with the same styling as Input. Same props as the React Textarea; `value` is bindable. -->
<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';

  type Props = Omit<HTMLTextareaAttributes, 'class' | 'children'> & {
    mono?: boolean;
    size?: 'md' | 'sm';
    surface?: 'surface' | 'bg';
    className?: string;
  };

  let { mono, size = 'md', surface, className, value = $bindable(), ...rest }: Props = $props();
</script>

<textarea
  bind:value
  {...rest}
  class={['input', className].filter(Boolean).join(' ')}
  data-mono={mono ? '' : undefined}
  data-size={size}
  data-surface={surface === 'bg' ? 'bg' : undefined}
></textarea>
