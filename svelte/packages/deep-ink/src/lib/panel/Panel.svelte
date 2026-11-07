<!--
  Panel on `canvas` with a hairline border (registry item panel). Same props as the React Panel: title, headingLevel,
  actions, flush, titleStyle, padding, as, className plus any attribute and React handler (onClick...) of the root. `title` and `actions` (ReactNode in
  React) take a string or a snippet; the body is the children. With a title, the root is labelled by the heading.
  React's `ref` is `bind:element` here.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'title' | 'children'> &
    ReactHandlers<HTMLElement> & {
    /** Visible heading. When set, the panel is labelled by it. */
    title?: string | Snippet;
    /** Level of the title heading. Keep the page outline ordered. */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    /** Controls aligned to the end of the header. */
    actions?: string | Snippet;
    /** Removes the body padding, for tables and lists. */
    flush?: boolean;
    /** `heading` (16px, default) or `label` (12px uppercase, muted). */
    titleStyle?: 'heading' | 'label';
    /** `md` = 16px padding (default), `lg` = 20px. */
    padding?: 'md' | 'lg';
    /** Root element. */
    as?: 'section' | 'div' | 'article' | 'aside';
    className?: string;
    element?: HTMLElement;
    children?: Snippet;
  };

  let {
    title,
    headingLevel = 2,
    actions,
    flush,
    titleStyle = 'heading',
    padding = 'md',
    as = 'section',
    className,
    element = $bindable(),
    children,
    ...rest
  }: Props = $props();

  const titleId = $props.id();
</script>

<svelte:element
  this={as}
  bind:this={element}
  {...reactEvents(rest)}
  class={['panel', className].filter(Boolean).join(' ')}
  data-flush={flush ? '' : undefined}
  data-title={titleStyle === 'label' ? 'label' : undefined}
  data-pad={padding === 'lg' ? 'lg' : undefined}
  aria-labelledby={title ? titleId : rest['aria-labelledby']}
  >{#if title || actions}<div class="panel-header"
      >{#if title}<svelte:element this={`h${headingLevel}`} class="panel-title" id={titleId}
          >{#if typeof title === 'function'}{@render title()}{:else}{title}{/if}</svelte:element
        >{/if}{#if actions}<div class="panel-actions"
          >{#if typeof actions === 'function'}{@render actions()}{:else}{actions}{/if}</div
        >{/if}</div
    >{/if}<div class="panel-body">{@render children?.()}</div></svelte:element
>
