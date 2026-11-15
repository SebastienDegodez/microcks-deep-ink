
<script lang="ts" module>
  export interface ExchangeBlock {
    /** Accessible name of the block ("Request line", "Response body"). */
    label: string;
    text: string;
    /** `secondary` (request line), `params` (warning), `headers` (muted), `body` (default, --text). */
    tone?: 'secondary' | 'params' | 'headers' | 'body';
    /** Fills the remaining height of the card. */
    grow?: boolean;
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'title' | 'children'> &
    NativeHandlers<HTMLElement> & {
    /** Head title, uppercase in CSS: "Request", "Response". */
    title: string;
    /** Accessible name of the card: "Request of Eclair Cafe". */
    label: string;
    /** Mono text at the end of the head (the example name). */
    meta?: string | Snippet;
    /** Filled status at the end of the head: "200 OK". */
    status?: string | Snippet;
    statusTone?: 'success' | 'warning' | 'danger';
    blocks: ExchangeBlock[];
    /** `md` (default, Service) or `sm` (Copilot compact head). */
    size?: 'md' | 'sm';
    /** Level of the title heading; `none` renders a span. */
    headingLevel?: 3 | 4 | 5 | 6 | 'none';
    class?: string;
  };

  let { title, label, meta, status, statusTone = 'success', blocks, size = 'md', headingLevel = 4, class: cssClass, ...rest }: Props = $props();
</script>

<section
  {...eventProps(rest)}
  aria-label={label}
  class={['exchange-card', cssClass].filter(Boolean).join(' ')}
  data-size={size === 'sm' ? 'sm' : undefined}
  ><div class="exchange-card-head"
    ><svelte:element this={headingLevel === 'none' ? 'span' : `h${headingLevel}`} class="exchange-card-title"
      >{title}</svelte:element
    >{#if meta}<span class="exchange-card-meta">{#if typeof meta === 'function'}{@render meta()}{:else}{meta}{/if}</span
      >{/if}{#if status}<span class="exchange-card-status" data-tone={statusTone === 'success' ? undefined : statusTone}
        >{#if typeof status === 'function'}{@render status()}{:else}{status}{/if}</span
      >{/if}</div
  >{#each blocks as b, i (i)}<!-- A block can scroll, so it is focusable and named (WCAG 2.1.1). --><!-- svelte-ignore a11y_no_noninteractive_tabindex --><pre
      role="region"
      aria-label={b.label}
      tabindex="0"
      data-tone={b.tone && b.tone !== 'body' ? b.tone : undefined}
      data-grow={b.grow ? '' : undefined}>{b.text}</pre
    >{/each}</section
>
