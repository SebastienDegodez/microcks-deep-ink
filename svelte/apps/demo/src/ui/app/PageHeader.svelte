<script lang="ts" module>
  import type { Snippet } from 'svelte';

  export type Content = string | Snippet;

  export interface Crumb {
    label: Content;
    /** Route of the crumb. The last crumb (the current page) has none. */
    to?: string;
  }

  export interface PageHeaderProps {
    /** The page's single `<h1>`. With `variant="badge"` it is an `ApiBadge` (size `xl`): the badge is the title. */
    title: Content;
    /** Trail of parent pages, rendered as `<nav aria-label="Breadcrumb">` above the title row. */
    breadcrumb?: Crumb[];
    /** Breadcrumb separator: `›` (default, most screens), `/` (Service) or `chevron` (a 12px icon, Workflow). */
    breadcrumbSeparator?: '›' | '/' | 'chevron';
    /** Note between the breadcrumb and the title row (Copilot "Opened from a workflow run"). Pass an element with its own role. */
    notice?: Snippet;
    /** Mono pill beside the title ("11 services · 29 operations"). */
    meta?: Content;
    /** Badge next to the title (an ApiBadge, a StatusBadge...). */
    badge?: Snippet;
    /** Node before the title in the title row (a service badge on Tests, a method tag on Behavior). */
    leading?: Snippet;
    /** Lead paragraph under the title row (14px, max 720px). */
    description?: Content;
    /** Maximum width of the description in px (default 720; the prototype uses 680–780 depending on the screen). */
    descriptionWidth?: number;
    /** `muted` (default) or `secondary` text colour for the description. */
    descriptionTone?: 'muted' | 'secondary';
    /** Page-level actions (buttons, a Menu). The primary action of the page goes first. */
    actions?: Snippet;
    /** `sm` = 30px, `md` = 32px title (default), `lg` = 34px. Applies to the `brand` variant. */
    size?: 'sm' | 'md' | 'lg';
    /**
     * Title font: `brand` (Alegreya Sans SC 800, default), `plain` (IBM Plex Sans 600 28px, as on Import) or
     * `subtitle` (Alegreya Sans SC 700 26px, secondary text, after a leading badge, as on Tests) or
     * `mono` (JetBrains Mono 600 24px, an operation path, as on Behavior) or `badge` (the title is an api-badge,
     * as on Service, Agent and Workflow; 15px description up to 760px).
     */
    variant?: 'brand' | 'plain' | 'subtitle' | 'mono' | 'badge';
    /** Vertical alignment of the actions: `end` (default, bottom-aligned with the description) or `start`. */
    align?: 'end' | 'start';
    /** Extra rows under the description, in the title column (labels, proof badges). */
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { Icon } from '@microcks/deep-ink';
  import RouterLink from './RouterLink.svelte';
  import { PAGE_TITLE_ID } from './page-title.svelte.js';

  /**
   * Renders the ONLY `<h1>` of the page. It is focusable (`tabindex="-1"`) so `usePageTitle` can move
   * focus to it when the route changes. Section headings below it are `<h2>`.
   * The wrapper is a `div`, not a `header`, so the page has exactly one banner landmark (the top bar).
   */
  let {
    title,
    breadcrumb,
    breadcrumbSeparator = '›',
    notice,
    meta,
    badge,
    leading,
    description,
    descriptionWidth,
    descriptionTone = 'muted',
    actions,
    size = 'md',
    variant = 'brand',
    align = 'end',
    children,
  }: PageHeaderProps = $props();
</script>

{#snippet content(value: Content)}{#if typeof value === 'function'}{@render value()}{:else}{value}{/if}{/snippet}

<div class="demo-page-header" data-align={align} data-variant={variant}
  >{#if breadcrumb && breadcrumb.length > 0}<nav aria-label="Breadcrumb" class="demo-breadcrumb"
      ><ol
        >{#each breadcrumb as crumb, i (i)}{@const last = i === breadcrumb.length - 1}<li
            >{#if i > 0}<span aria-hidden="true" class="demo-breadcrumb-sep"
                >{#if breadcrumbSeparator === 'chevron'}<Icon name="chevron" size={12} />{:else}{breadcrumbSeparator}{/if}</span
              >{/if}{#if crumb.to && !last}<RouterLink to={crumb.to}>{@render content(crumb.label)}</RouterLink
              >{:else}<span aria-current={last ? 'page' : undefined}>{@render content(crumb.label)}</span>{/if}</li
          >{/each}</ol
      ></nav
    >{/if}{@render notice?.()}<div class="demo-page-header-row"
    ><div class="demo-page-header-text"
      ><div class="demo-page-title-row" data-leading={leading ? '' : undefined}
        >{@render leading?.()}<h1 id={PAGE_TITLE_ID} tabindex="-1" class="demo-page-title" data-size={size} data-variant={variant}
          >{@render content(title)}</h1
        >{#if meta}<span class="demo-page-meta">{@render content(meta)}</span>{/if}{@render badge?.()}</div
      >{#if description}<p
          class="demo-page-description"
          data-tone={descriptionTone}
          style:max-width={descriptionWidth ? `${descriptionWidth}px` : undefined}>{@render content(description)}</p
        >{/if}{@render children?.()}</div
    >{#if actions}<div class="demo-page-actions">{@render actions()}</div>{/if}</div
  ></div
>
