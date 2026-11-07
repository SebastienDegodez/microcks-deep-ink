
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> &
    NativeHandlers<HTMLSpanElement> & {
    /** Supplementary tooltip. The visible text must stand alone. */
    title?: string;
    class?: string;
    children?: Snippet;
  };

  let { class: cssClass, children, ...rest }: Props = $props();
</script>

<span {...eventProps(rest)} class={['projection-pill', cssClass].filter(Boolean).join(' ')}
  >{#if children}{@render children()}{:else}Projection · v2 module{/if}</span
>
