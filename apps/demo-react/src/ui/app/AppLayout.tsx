import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, Outlet, useLocation, useMatches } from 'react-router';
import { getTheme, setTheme, subscribeTheme, type Theme } from '@/ui/lib/theme';
import { LiveAnnouncerProvider } from './announcer';
import { DemoBanner } from './DemoBanner';
import { NAV_ITEMS, type RouteHandle } from './nav';

function ThemeButton() {
  const [theme, setCurrent] = useState<Theme>(getTheme());
  useEffect(() => subscribeTheme(setCurrent), []);
  const light = theme === 'light';
  return (
    <button
      type="button"
      className="button"
      data-variant="ghost"
      data-icon-only
      aria-label="Light theme"
      aria-pressed={light}
      onClick={() => setTheme(light ? 'dark' : 'light')}
    >
      <span aria-hidden="true">{light ? '☀' : '☾'}</span>
    </button>
  );
}

/**
 * Application shell, built from raw markup with the `` classes of the `app-shell` item
 * (the registry component is not copied yet; swap it in once it is):
 * skip link, banner (top bar), navigation, main landmark, live region for route announcements.
 *
 * Note on the skip link: with a hash router `href="#main"` would navigate, so the click is
 * intercepted and focus is moved to `<main id="main" tabindex="-1">` instead.
 */
export function AppLayout() {
  const matches = useMatches();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const activeNav = [...matches].reverse().map((m) => (m.handle as RouteHandle | undefined)?.nav).find(Boolean);

  // Close the collapsed navigation after each navigation.
  const pathRef = useRef(location.pathname);
  useEffect(() => {
    if (pathRef.current !== location.pathname) {
      pathRef.current = location.pathname;
      setNavOpen(false);
    }
  }, [location.pathname]);

  const skip = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    mainRef.current?.focus();
  };

  return (
    <LiveAnnouncerProvider>
      <a className="skip-link" href="#main" onClick={skip}>
        Skip to content
      </a>
      <div className="shell">
        <header className="topbar">
          <Link to="/" className="demo-brand">
            Microcks
          </Link>
          <DemoBanner />
          <div className="demo-topbar-actions">
            <ThemeButton />
            <button
              type="button"
              className="button demo-nav-toggle"
              aria-expanded={navOpen}
              aria-controls="main-nav"
              onClick={() => setNavOpen((open) => !open)}
            >
              Menu
            </button>
          </div>
        </header>
        <nav id="main-nav" className="sidenav" aria-label="Main" data-collapsible data-open={navOpen || undefined}>
          <ul className="demo-nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <Link to={item.to} className="sidenav-link" aria-current={item.id === activeNav ? 'page' : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main id="main" ref={mainRef} tabIndex={-1} className="main">
          <Outlet />
        </main>
      </div>
    </LiveAnnouncerProvider>
  );
}
