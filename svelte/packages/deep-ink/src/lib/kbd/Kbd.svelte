<!-- Keyboard key cap (registry item kbd). Same props as the React Kbd: className plus any <kbd> attribute. -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> & { className?: string; children?: Snippet };

  let { className, children, ...rest }: Props = $props();
</script>

<kbd {...rest} class={['kbd', className].filter(Boolean).join(' ')}>{@render children?.()}</kbd>
