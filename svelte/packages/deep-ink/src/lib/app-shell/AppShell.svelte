<!--
  Page frame (registry item app-shell): skip link, top bar (banner landmark) with the Menu disclosure, main navigation
  and main content. Same props as the React AppShell: brand, nav, activeId, topbarCenter, topbarActions, banner,
  skipLinkLabel, navLabel, children, renderLink. ReactNode props take a string or a snippet. renderLink is a snippet
  (item, props, content): spread `props` on your router link and render `content` inside it (React's props.children).
  Below 768px the Menu button opens the nav; Escape closes it and returns focus to the button; a chosen link closes it.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from '../button/Button.svelte';
  import Icon from '../icon/Icon.svelte';
  import type { ShellLinkProps, ShellNavItem } from './app-shell';

  type Slot = string | Snippet;

  interface Props {
    brand: Slot;
    nav: ShellNavItem[];
    activeId: string;
    /** Centre of the top bar, between the brand and the actions (for example a search button). */
    topbarCenter?: Slot;
    topbarActions?: Slot;
    /** Site-wide notice rendered under the top bar (for example a DEMO callout). */
    banner?: Slot;
    skipLinkLabel?: string;
    navLabel?: string;
    children: Snippet;
    /** Render nav links with your router: spread `props` on the link and render `content` in it. */
    renderLink?: Snippet<[ShellNavItem, ShellLinkProps, Snippet]>;
  }

  let { brand, nav, activeId, topbarCenter, topbarActions, banner, skipLinkLabel = 'Skip to content', navLabel = 'Main', children, renderLink }: Props = $props();

  const navId = $props.id();
  let open = $state(false);
  let menu = $state<HTMLButtonElement>();
  let main = $state<HTMLElement>();

  // Escape closes the narrow-screen navigation and returns focus to the Menu button.
  $effect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        open = false;
        menu?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // Leaving the narrow layout resets the disclosure.
  $effect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 767px)');
    const reset = () => {
      if (!mq.matches) open = false;
    };
    mq.addEventListener?.('change', reset);
    return () => mq.removeEventListener?.('change', reset);
  });

  const linkProps = (item: ShellNavItem): ShellLinkProps => ({
    class: 'sidenav-link',
    href: item.href,
    'aria-current': item.id === activeId ? 'page' : undefined,
    onclick: () => (open = false),
  });
</script>

{#snippet slot(s: Slot)}{#if typeof s === 'function'}{@render s()}{:else}{s}{/if}{/snippet}

<div class="shell">
  <!-- A hash router would treat href="#main" as a route: focus the element instead of navigating. -->
  <a
    class="skip-link"
    href="#main"
    onclick={(e) => {
      e.preventDefault();
      main?.focus();
    }}>{skipLinkLabel}</a
  >
  <header class="topbar">
    <Button
      bind:element={menu}
      type="button"
      variant="ghost"
      className="shell-menu"
      aria-expanded={open}
      aria-controls={navId}
      onclick={() => (open = !open)}><Icon name={open ? 'close' : 'menu'} size={18} />Menu</Button
    >
    <div class="topbar-brand">{@render slot(brand)}</div>
    {#if topbarCenter}<div class="topbar-center">{@render slot(topbarCenter)}</div>{/if}
    {#if topbarActions}<div class="topbar-actions">{@render slot(topbarActions)}</div>{/if}
  </header>
  {#if banner}<div class="shell-banner">{@render slot(banner)}</div>{/if}
  <nav class="sidenav" id={navId} aria-label={navLabel} data-open={open ? 'true' : 'false'}>
    <ul>
      {#each nav as item (item.id)}
        {#snippet content()}{#if item.icon}<Icon name={item.icon} size={18} />{/if}<span>{item.label}</span
          >{#if item.badge}<span class="sidenav-badge">{item.badge}</span>{/if}{/snippet}
        <li>
          {#if renderLink}{@render renderLink(item, linkProps(item), content)}{:else}<a {...linkProps(item)}>{@render content()}</a>{/if}
        </li>
      {/each}
    </ul>
  </nav>
  <main id="main" tabindex="-1" class="main" bind:this={main}>
    {@render children()}
  </main>
</div>
