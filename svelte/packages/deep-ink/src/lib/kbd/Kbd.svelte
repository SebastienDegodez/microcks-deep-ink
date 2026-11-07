
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> & NativeHandlers<HTMLElement> & { class?: string; children?: Snippet };

  let { class: cssClass, children, ...rest }: Props = $props();
</script>

<kbd {...eventProps(rest)} class={['kbd', cssClass].filter(Boolean).join(' ')}>{@render children?.()}</kbd>
