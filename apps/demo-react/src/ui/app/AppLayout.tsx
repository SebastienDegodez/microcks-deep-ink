import { useMemo, useState } from 'react';
import { Link, Outlet, useMatches, useNavigate } from 'react-router';
import type { CommandItem as CatalogCommand } from '@/domain/catalog/types';
import { AppShell, type ShellNavItem } from '@/ui/components/ui/app-shell';
import { Button } from '@/ui/components/ui/button';
import { Icon } from '@/ui/components/ui/icon';
import { CommandBar, type CommandItem } from '@/ui/components/ui/command-bar';
import { ThemeToggle } from '@/ui/components/ui/theme-toggle';
import { useQuery } from './hooks';
import { LiveAnnouncerProvider } from './announcer';
import microcksLogo from './microcks-logo.svg';
import { NAV_ITEMS, type RouteHandle } from './nav';
import { useUseCases } from './UseCasesProvider';

/** "⌘K" on Apple platforms, "Ctrl K" elsewhere. */
const SHORTCUT = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘K' : 'Ctrl K';

const NAV: ShellNavItem[] = NAV_ITEMS.map((item) => ({ id: item.id, label: item.label, href: item.to }));

/** Domain command kinds ("Page", "Service", "Workflow") to the command bar kinds. */
function toCommandItem(c: CatalogCommand): CommandItem {
  const kind = c.kind === 'Service' ? 'service' : c.kind === 'Workflow' ? 'operation' : 'action';
  return { id: c.id, label: c.kind === 'Page' ? `Go to ${c.label}` : c.label, kind, hint: c.hint ?? (c.kind === 'Page' ? 'Page' : c.kind) };
}

/**
 * Application shell: the copied `app-shell` (skip link, banner, navigation, main landmark), the `theme-toggle`
 * and the `command-bar` (Ctrl/Cmd+K) items of the design system. Top bar: brand, the search
 * button (centre), then Import a contract, the theme toggle and the avatar.
 *
 * Skip link: with a hash router `href="#main"` would navigate, so `app-shell` intercepts the click and moves
 * focus to `<main id="main" tabindex="-1">`.
 */
export function AppLayout() {
  const matches = useMatches();
  const navigate = useNavigate();
  const uc = useUseCases();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const activeNav = [...matches].reverse().map((m) => (m.handle as RouteHandle | undefined)?.nav).find(Boolean) ?? '';

  const commands = useQuery(() => uc.catalog.commands(), [uc]);
  const { items, hrefById } = useMemo(() => {
    const byId = new Map<string, string>();
    const list: CommandItem[] = [];
    // Navigation to every entry of the main menu, then the catalogue commands (deduplicated by route).
    const seen = new Set<string>();
    for (const n of NAV_ITEMS) {
      list.push({ id: `nav-${n.id}`, label: `Go to ${n.label}`, kind: 'action', hint: 'Page' });
      byId.set(`nav-${n.id}`, n.to);
      seen.add(n.to);
    }
    for (const c of commands.data ?? []) {
      if (!c.href || seen.has(c.href)) continue;
      list.push(toCommandItem(c));
      byId.set(c.id, c.href);
    }
    return { items: list, hrefById: byId };
  }, [commands.data]);

  return (
    <LiveAnnouncerProvider>
      <AppShell
        brand={
          <Link to="/" className="demo-brand">
            <img src={microcksLogo} alt="" width={30} height={26} />
            Microcks
          </Link>
        }
        nav={NAV}
        activeId={activeNav}
        topbarCenter={
          <button type="button" className="demo-search" aria-haspopup="dialog" onClick={() => setPaletteOpen(true)}>
            <Icon name="search" size={16} />
            <span className="demo-search-text">Search an API, an operation, a command…</span>
            <kbd aria-hidden="true">{SHORTCUT}</kbd>
          </button>
        }
        topbarActions={
          <>
            <Button asChild variant="primary" icon="download">
              <Link to="/sources/new">Import a contract</Link>
            </Button>
            <ThemeToggle />
            <span className="demo-avatar" role="img" aria-label="Signed in as MA">
              MA
            </span>
          </>
        }
        renderLink={(_item, props) => {
          const { href, children, ...rest } = props;
          return (
            <Link {...rest} to={href}>
              {children}
            </Link>
          );
        }}
      >
        <Outlet />
      </AppShell>
      <CommandBar
        items={items}
        open={paletteOpen}
        label="Search and commands"
        placeholder="Search APIs, workflows and pages"
        onClose={() => setPaletteOpen(false)}
        onCommand={(item) => {
          const href = hrefById.get(item.id);
          if (href) void navigate(href);
        }}
      />
    </LiveAnnouncerProvider>
  );
}
