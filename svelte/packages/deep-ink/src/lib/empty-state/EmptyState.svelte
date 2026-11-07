<!--
  Empty list or page (registry item empty-state): a section labelled by its heading. Same props as the React EmptyState:
  title, headingLevel, icon, align, actions, children, className plus any <section> attribute and React handler
  (onClick...). `actions` (ReactNode in React) takes a string or a snippet; the body is the children.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from '../icon/Icon.svelte';
  import type { IconName } from '../icon/Icon.svelte';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'title' | 'children'> &
    ReactHandlers<HTMLElement> & {
    title: string;
    /** Heading level of the title (1-6). Keep the page heading order sequential. */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    /** Decorative 40px icon above the title ("search-x" for no results). */
    icon?: IconName;
    /** `center` (default) or `start`. */
    align?: 'center' | 'start';
    actions?: string | Snippet;
    className?: string;
    children?: Snippet;
  };

  let { title, headingLevel = 2, icon, align = 'center', actions, className, children, ...rest }: Props = $props();

  const id = $props.id();
</script>

<section {...reactEvents(rest)} class={['empty', className].filter(Boolean).join(' ')} aria-labelledby={id} data-align={align}
  >{#if icon}<span class="empty-icon"><Icon name={icon} size={40} /></span>{/if}<svelte:element
    this={`h${headingLevel}`}
    class="empty-title"
    {id}>{title}</svelte:element
  >{#if children}<div class="empty-body">{@render children()}</div>{/if}{#if actions}<div class="empty-actions"
      >{#if typeof actions === 'function'}{@render actions()}{:else}{actions}{/if}</div
    >{/if}</section
>
