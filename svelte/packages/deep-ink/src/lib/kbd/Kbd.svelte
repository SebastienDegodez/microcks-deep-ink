<!-- Keyboard key cap (registry item kbd). Same props as the React Kbd: className plus any <kbd> attribute and React handler (onClick...). -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> & ReactHandlers<HTMLElement> & { className?: string; children?: Snippet };

  let { className, children, ...rest }: Props = $props();
</script>

<kbd {...reactEvents(rest)} class={['kbd', className].filter(Boolean).join(' ')}>{@render children?.()}</kbd>
