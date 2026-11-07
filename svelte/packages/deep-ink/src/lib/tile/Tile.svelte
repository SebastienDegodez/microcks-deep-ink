<!--
  Card for a package, a service, a workflow or an agent (registry item tile). The whole tile is clickable through one
  real link or button (the title) stretched over it; footer controls stay separate. Same props as the React Tile:
  title, headingLevel, media, meta, aside, footer, href, onSelect, renderAction, selected, as, className plus any
  attribute and React handler (onClick...) of the root. `title`, `media`, `meta`, `aside` and `footer` (ReactNode in
  React) are strings or snippets, the body is the children; `renderAction` is a snippet given the TileActionProps to
  spread on your router link. React's `ref` is `bind:element` here.
-->
<script lang="ts" module>
  import type { Snippet } from 'svelte';

  export interface TileActionProps {
    className: 'tile-action';
    id: string;
    'aria-current'?: 'true';
    children: string | Snippet;
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'title' | 'children' | 'onselect'> &
    Omit<ReactHandlers<HTMLElement>, 'onSelect'> & {
    /** Visible name. It names the tile and, when the tile is interactive, it is the one link or button. */
    title: string | Snippet;
    /** Level of the title heading. Keep the page outline ordered. */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** Logo, icon or picture before the title. Decorative unless you give it a name. */
    media?: string | Snippet;
    /** One line under the title: "maintained by community · 3 APIs". */
    meta?: string | Snippet;
    /** End of the header: a category tag (`<span class="tile-tag">`), a status. */
    aside?: string | Snippet;
    /** Footer row: actions and, in `<span class="tile-footer-end">`, totals. */
    footer?: string | Snippet;
    /** The title becomes a link stretched over the tile. */
    href?: string;
    /** The title becomes a toggle button stretched over the tile (`aria-pressed` follows `selected`). */
    onSelect?: () => void;
    /** Renders the title link yourself, for router links. Spread the props on it. */
    renderAction?: Snippet<[TileActionProps]>;
    /** Selected tile: the link gets `aria-current`, the button `aria-pressed`. */
    selected?: boolean;
    /** Root element: `article` (default) or `li` inside a `<ul class="tile-grid">`. */
    as?: 'article' | 'li' | 'div';
    className?: string;
    element?: HTMLElement;
    children?: Snippet;
  };

  let {
    title,
    headingLevel = 3,
    media,
    meta,
    aside,
    footer,
    href,
    onSelect,
    renderAction,
    selected,
    as = 'article',
    className,
    element = $bindable(),
    children,
    ...rest
  }: Props = $props();

  const titleId = $props.id();
  const interactive = $derived(Boolean(href || onSelect || renderAction));
  const actionProps: TileActionProps = $derived({
    className: 'tile-action',
    id: titleId,
    'aria-current': selected ? 'true' : undefined,
    children: title,
  });
</script>

{#snippet content(c: string | Snippet | undefined)}{#if typeof c === 'function'}{@render c()}{:else}{c}{/if}{/snippet}

<svelte:element
  this={as}
  bind:this={element}
  {...reactEvents(rest)}
  class={['tile', className].filter(Boolean).join(' ')}
  aria-labelledby={rest['aria-labelledby'] ?? titleId}
  data-interactive={interactive ? '' : undefined}
  data-selected={selected ? '' : undefined}
  ><div class="tile-head"
    >{#if media}<span class="tile-media">{@render content(media)}</span>{/if}<div class="tile-heading"
      ><svelte:element this={`h${headingLevel}`} class="tile-title"
        >{#if renderAction}{@render renderAction(actionProps)}{:else if href}<a
            class="tile-action"
            id={titleId}
            {href}
            aria-current={actionProps['aria-current']}>{@render content(title)}</a
          >{:else if onSelect}<button
            type="button"
            class="tile-action"
            id={titleId}
            aria-pressed={selected ? 'true' : 'false'}
            onclick={onSelect}>{@render content(title)}</button
          >{:else}<span id={titleId}>{@render content(title)}</span>{/if}</svelte:element
      >{#if meta}<span class="tile-meta">{@render content(meta)}</span>{/if}</div
    >{#if aside}<span class="tile-aside">{@render content(aside)}</span>{/if}</div
  >{#if children}<div class="tile-body">{@render children()}</div>{/if}{#if footer}<div class="tile-footer"
      >{@render content(footer)}</div
    >{/if}</svelte:element
>
