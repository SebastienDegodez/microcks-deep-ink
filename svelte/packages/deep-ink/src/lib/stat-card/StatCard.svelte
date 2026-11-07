<!--
  One key figure (registry item stat-card): a small heading, a big number with its unit, and optional detail under it.
  Same props as the React StatCard: title, headingLevel, action, value, unit, tone, className plus any <section>
  attribute and React handler (onClick...). `title`, `action`, `value` and `unit` (ReactNode in React) take a string or
  a snippet; the detail is the children. The card is a region labelled by its heading.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'title' | 'children'> &
    ReactHandlers<HTMLElement> & {
    /** Small uppercase heading: "Mock invocations · 7 days". */
    title: string | Snippet;
    /** Level of the title heading. Keep the page outline ordered. */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** A link at the end of the header ("Catalogue", "Details"). */
    action?: string | Snippet;
    /** The big figure, always written as text: "638", "78%". */
    value: string | number | Snippet;
    /** Text after the figure on the same line: "requests", "29 operations". */
    unit?: string | Snippet;
    /** Colour of the figure. The meaning must also be in the text. */
    tone?: 'neutral' | 'success' | 'warning' | 'danger';
    className?: string;
    children?: Snippet;
  };

  let { title, headingLevel = 2, action, value, unit, tone = 'neutral', className, children, ...rest }: Props = $props();

  const id = $props.id();
</script>

<section {...reactEvents(rest)} class={['stat-card', className].filter(Boolean).join(' ')} aria-labelledby={id} data-tone={tone}
  ><div class="stat-card-head"
    ><svelte:element this={`h${headingLevel}`} class="stat-card-title" {id}
      >{#if typeof title === 'function'}{@render title()}{:else}{title}{/if}</svelte:element
    >{#if action}<span class="stat-card-action">{#if typeof action === 'function'}{@render action()}{:else}{action}{/if}</span
      >{/if}</div
  ><p class="stat-card-figure"
    ><span class="stat-card-value">{#if typeof value === 'function'}{@render value()}{:else}{value}{/if}</span
    >{#if unit}<span class="stat-card-unit">{#if typeof unit === 'function'}{@render unit()}{:else}{unit}{/if}</span>{/if}</p
  >{#if children}<div class="stat-card-body">{@render children()}</div>{/if}</section
>
