
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from '../icon/Icon.svelte';
  import type { IconName } from '../icon/Icon.svelte';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'title' | 'children'> &
    NativeHandlers<HTMLElement> & {
    title: string;
    /** Heading level of the title (1-6). Keep the page heading order sequential. */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    /** Decorative 40px icon above the title ("search-x" for no results). */
    icon?: IconName;
    /** `center` (default) or `start`. */
    align?: 'center' | 'start';
    actions?: string | Snippet;
    class?: string;
    children?: Snippet;
  };

  let { title, headingLevel = 2, icon, align = 'center', actions, class: cssClass, children, ...rest }: Props = $props();

  const id = $props.id();
</script>

<section {...eventProps(rest)} class={['empty', cssClass].filter(Boolean).join(' ')} aria-labelledby={id} data-align={align}
  >{#if icon}<span class="empty-icon"><Icon name={icon} size={40} /></span>{/if}<svelte:element
    this={`h${headingLevel}`}
    class="empty-title"
    {id}>{title}</svelte:element
  >{#if children}<div class="empty-body">{@render children()}</div>{/if}{#if actions}<div class="empty-actions"
      >{#if typeof actions === 'function'}{@render actions()}{:else}{actions}{/if}</div
    >{/if}</section
>
