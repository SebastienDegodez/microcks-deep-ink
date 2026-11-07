
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> &
    NativeHandlers<HTMLDivElement> & {
    /** Draws a decorative ⇄ between the two cards. */
    separator?: boolean;
    /** Exactly two ExchangeCards: request, then response. */
    children: [string | Snippet, string | Snippet];
    class?: string;
  };

  let { separator = true, class: cssClass, children, ...rest }: Props = $props();
</script>

{#snippet part(p: string | Snippet)}{#if typeof p === 'function'}{@render p()}{:else}{p}{/if}{/snippet}

<div {...eventProps(rest)} class={['exchange', cssClass].filter(Boolean).join(' ')}
  >{@render part(children[0])}{#if separator}<div class="exchange-sep" aria-hidden="true">⇄</div>{/if}{@render part(
      children[1],
    )}</div
>
