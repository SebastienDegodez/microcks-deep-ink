import { useEffect, useId, useRef, useState, type AnchorHTMLAttributes, type ComponentProps, type ReactNode } from 'react';
import { Button } from './button';
import { Icon } from './icon';

export interface ShellNavItem {
  id: string;
  label: string;
  href: string;
  /** Icon name from the icon item. */
  icon?: ComponentProps<typeof Icon>['name'];
  badge?: string;
}

/** Props to spread on the element you render in `renderLink`. */
export interface ShellLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  className: string;
  href: string;
  'aria-current'?: 'page';
  onClick: () => void;
  children: ReactNode;
}

export interface AppShellProps {
  brand: ReactNode;
  nav: ShellNavItem[];
  activeId: string;
  /** Centre of the top bar, between the brand and the actions (for example a search button). */
  topbarCenter?: ReactNode;
  topbarActions?: ReactNode;
  /** Site-wide notice rendered under the top bar (for example a DEMO callout). */
  banner?: ReactNode;
  skipLinkLabel?: string;
  navLabel?: string;
  children: ReactNode;
  /** Render nav links with your router: spread `props` on the link you return. */
  renderLink?: (item: ShellNavItem, props: ShellLinkProps) => ReactNode;
}

const NARROW = '(max-width: 767px)';

export function AppShell({ brand, nav, activeId, topbarCenter, topbarActions, banner, skipLinkLabel = 'Skip to content', navLabel = 'Main', children, renderLink }: AppShellProps) {
  const navId = useId();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Escape closes the narrow-screen navigation and returns focus to the Menu button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        menuRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Leaving the narrow layout resets the disclosure.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(NARROW);
    const reset = () => {
      if (!mq.matches) setOpen(false);
    };
    mq.addEventListener?.('change', reset);
    return () => mq.removeEventListener?.('change', reset);
  }, []);

  return (
    <div className="shell">
      {/* A hash router would treat href="#main" as a route: focus the element instead of navigating. */}
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
      >
        {skipLinkLabel}
      </a>
      <header className="topbar">
        <Button
          ref={menuRef}
          type="button"
          variant="ghost"
          className="shell-menu"
          aria-expanded={open}
          aria-controls={navId}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? 'close' : 'menu'} size={18} />
          Menu
        </Button>
        <div className="topbar-brand">{brand}</div>
        {topbarCenter ? <div className="topbar-center">{topbarCenter}</div> : null}
        {topbarActions ? <div className="topbar-actions">{topbarActions}</div> : null}
      </header>
      {banner ? <div className="shell-banner">{banner}</div> : null}
      <nav className="sidenav" id={navId} aria-label={navLabel} data-open={open ? 'true' : 'false'}>
        <ul>
          {nav.map((item) => {
            const props: ShellLinkProps = {
              className: 'sidenav-link',
              href: item.href,
              onClick: () => setOpen(false),
              'aria-current': item.id === activeId ? 'page' : undefined,
              children: (
                <>
                  {item.icon ? <Icon name={item.icon} size={18} /> : null}
                  <span>{item.label}</span>
                  {item.badge ? <span className="sidenav-badge">{item.badge}</span> : null}
                </>
              ),
            };
            return <li key={item.id}>{renderLink ? renderLink(item, props) : <a {...props}>{props.children}</a>}</li>;
          })}
        </ul>
      </nav>
      <main id="main" tabIndex={-1} className="main" ref={mainRef}>
        {children}
      </main>
    </div>
  );
}
