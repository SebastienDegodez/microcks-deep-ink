
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLDetailsAttributes } from 'svelte/elements';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLDetailsAttributes, 'class' | 'open' | 'children'> &
    NativeHandlers<HTMLDetailsElement> & {
    summary: string | Snippet;
    /** Open on first render; the user toggles it afterwards. */
    defaultOpen?: boolean;
    class?: string;
    children?: Snippet;
  };

  let { summary, defaultOpen, class: cssClass, children, ...rest }: Props = $props();
</script>

<details
  {...eventProps(rest)}
  class={['disclosure', cssClass].filter(Boolean).join(' ')}
  open={defaultOpen || undefined}
  ><summary>{#if typeof summary === 'function'}{@render summary()}{:else}{summary}{/if}</summary>{@render children?.()}</details
>
