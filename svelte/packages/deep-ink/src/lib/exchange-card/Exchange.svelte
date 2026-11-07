<!--
  A request and its response side by side (registry item exchange-card). Same props as the React Exchange: separator,
  children, className plus any <div> attribute and React handler (onClick...). As in React, `children` is a pair: the
  request then the response, each a string or a snippet (`<Exchange children={[request, response]} />`).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> &
    ReactHandlers<HTMLDivElement> & {
    /** Draws a decorative ⇄ between the two cards. */
    separator?: boolean;
    /** Exactly two ExchangeCards: request, then response. */
    children: [string | Snippet, string | Snippet];
    className?: string;
  };

  let { separator = true, className, children, ...rest }: Props = $props();
</script>

{#snippet part(p: string | Snippet)}{#if typeof p === 'function'}{@render p()}{:else}{p}{/if}{/snippet}

<div {...reactEvents(rest)} class={['exchange', className].filter(Boolean).join(' ')}
  >{@render part(children[0])}{#if separator}<div class="exchange-sep" aria-hidden="true">⇄</div>{/if}{@render part(
      children[1],
    )}</div
>
