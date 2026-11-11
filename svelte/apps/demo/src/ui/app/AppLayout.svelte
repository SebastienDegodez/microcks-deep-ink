<script lang="ts" module>
  import type { CommandItem as CatalogCommand } from '@microcks/demo-core/domain/catalog';
  import type { CommandItem, ShellLinkProps, ShellNavItem } from '@microcks/deep-ink';
  import { NAV_ITEMS } from './nav';

  /** "⌘K" on Apple platforms, "Ctrl K" elsewhere. */
  const SHORTCUT = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘K' : 'Ctrl K';

  const NAV: ShellNavItem[] = NAV_ITEMS.map((item) => ({ id: item.id, label: item.label, href: item.to }));

  /** Domain command kinds ("Page", "Service", "Workflow") to the command bar kinds. */
  function toCommandItem(c: CatalogCommand): CommandItem {
    const kind = c.kind === 'Service' ? 'service' : c.kind === 'Workflow' ? 'operation' : 'action';
    return { id: c.id, label: c.kind === 'Page' ? `Go to ${c.label}` : c.label, kind, hint: c.hint ?? (c.kind === 'Page' ? 'Page' : c.kind) };
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { AppShell, ButtonLink, CommandBar, Icon, ThemeToggle } from '@microcks/deep-ink';
  import microcksLogo from '@microcks/demo-styles/app/microcks-logo.svg';
  import LiveAnnouncerProvider from './LiveAnnouncerProvider.svelte';
  import RouterLink from './RouterLink.svelte';
  import { useQuery } from './query.svelte.js';
  import { useRouter } from './router.svelte.js';
  import { useUseCases } from './services';

  /**
   * Application shell: the `app-shell` (skip link, banner, navigation, main landmark), the `theme-toggle`
   * and the `command-bar` (Ctrl/Cmd+K) of the design system. Top bar: brand, the search button (centre),
   * then Import a contract, the theme toggle and the avatar.
   *
   * Skip link: with a hash router `href="#main"` would navigate, so `app-shell` intercepts the click and moves
   * focus to `<main id="main" tabindex="-1">`.
   */
  let { children }: { children: Snippet } = $props();

  const router = useRouter();
  const uc = useUseCases();
  let paletteOpen = $state(false);
  const activeNav = $derived(
    [...router.matches]
      .reverse()
      .map((m) => m.route.handle?.nav)
      .find(Boolean) ?? '',
  );

  const commands = useQuery(() => uc.catalog.commands());
  const palette = $derived.by(() => {
    const hrefById = new Map<string, string>();
    const items: CommandItem[] = [];
    // Navigation to every entry of the main menu, then the catalogue commands (deduplicated by route).
    const seen = new Set<string>();
    for (const n of NAV_ITEMS) {
      items.push({ id: `nav-${n.id}`, label: `Go to ${n.label}`, kind: 'action', hint: 'Page' });
      hrefById.set(`nav-${n.id}`, n.to);
      seen.add(n.to);
    }
    for (const c of commands.data ?? []) {
      if (!c.href || seen.has(c.href)) continue;
      items.push(toCommandItem(c));
      hrefById.set(c.id, c.href);
    }
    return { items, hrefById };
  });
</script>

{#snippet brand()}<RouterLink to="/" class="demo-brand"><img src={microcksLogo} alt="" width="30" height="26" />Microcks</RouterLink>{/snippet}

{#snippet topbarCenter()}<button type="button" class="demo-search" aria-haspopup="dialog" onclick={() => (paletteOpen = true)}
    ><Icon name="search" size={16} /><span class="demo-search-text">Search an API, an operation, a command…</span><kbd aria-hidden="true"
      >{SHORTCUT}</kbd
    ></button
  >{/snippet}

{#snippet topbarActions()}<ButtonLink
    variant="primary"
    icon="download"
    href={router.href('/sources/new')}
    onclick={(event) => router.followLink(event, '/sources/new')}
    data-discover="true">Import a contract</ButtonLink
  ><ThemeToggle /><span class="demo-avatar" role="img" aria-label="Signed in as MA">MA</span>{/snippet}

{#snippet renderLink(_item: ShellNavItem, props: ShellLinkProps, content: Snippet)}<RouterLink
    to={props.href}
    class={props.class}
    aria-current={props['aria-current']}
    onclick={props.onclick}>{@render content()}</RouterLink
  >{/snippet}

<LiveAnnouncerProvider
  ><AppShell {brand} nav={NAV} activeId={activeNav} {topbarCenter} {topbarActions} {renderLink}>{@render children()}</AppShell
  ><CommandBar
    items={palette.items}
    open={paletteOpen}
    label="Search and commands"
    placeholder="Search APIs, workflows and pages"
    onclose={() => (paletteOpen = false)}
    oncommand={(item) => {
      const href = palette.hrefById.get(item.id);
      if (href) router.navigate(href);
    }}
  /></LiveAnnouncerProvider
>
