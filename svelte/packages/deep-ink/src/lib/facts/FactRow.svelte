<!--
  One term/value pair of a Facts list (registry item facts), for rich values (links, badges, buttons). Same props as the
  React FactRow: term, sub, mono, tone, className plus any <div> attribute and React handler (onClick...). `term` and
  `sub` (ReactNode in React) take a string or a snippet; the value is the children.
-->
<script lang="ts" module>
  export type FactTone = 'success' | 'warning' | 'danger' | 'muted';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> &
    ReactHandlers<HTMLElement> & {
    term: string | Snippet;
    /** Muted 12px line under the value. */
    sub?: string | Snippet;
    /** Monospace 12px value (ids, paths, versions). */
    mono?: boolean;
    /** Colour of the value. The words must carry the meaning too. */
    tone?: FactTone;
    className?: string;
    children?: Snippet;
  };

  let { term, sub, mono, tone, className, children, ...rest }: Props = $props();
</script>

<div {...reactEvents(rest)} class={['facts-row', className].filter(Boolean).join(' ')}
  ><dt>{#if typeof term === 'function'}{@render term()}{:else}{term}{/if}</dt><dd data-mono={mono ? '' : undefined} data-tone={tone}
    >{#if sub}<span>{@render children?.()}</span><span class="facts-sub"
        >{#if typeof sub === 'function'}{@render sub()}{:else}{sub}{/if}</span
      >{:else}{@render children?.()}{/if}</dd
  ></div
>
