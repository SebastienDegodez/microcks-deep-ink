import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from '@/ui/components/ui/icon';
import { PAGE_TITLE_ID } from './usePageTitle';

export interface Crumb {
  label: ReactNode;
  /** Route of the crumb. The last crumb (the current page) has none. */
  to?: string;
}

export interface PageHeaderProps {
  /** The page's single `<h1>`. */
  title: string;
  /** Trail of parent pages, rendered as `<nav aria-label="Breadcrumb">` above the title row. */
  breadcrumb?: Crumb[];
  /** Breadcrumb separator: `›` (default, most screens), `/` (Service) or `chevron` (a 12px icon, Workflow). */
  breadcrumbSeparator?: '›' | '/' | 'chevron';
  /** Note between the breadcrumb and the title row (Copilot "Opened from a workflow run"). Pass an element with its own role. */
  notice?: ReactNode;
  /** Mono pill beside the title ("11 services · 29 operations"). */
  meta?: ReactNode;
  /** Badge next to the title (an ApiBadge, a StatusBadge...). */
  badge?: ReactNode;
  /** Node before the title in the title row (a service badge on Tests, a method tag on Behavior). */
  leading?: ReactNode;
  /** Lead paragraph under the title row (14px, max 720px). */
  description?: ReactNode;
  /** Maximum width of the description in px (default 720; the prototype uses 680–780 depending on the screen). */
  descriptionWidth?: number;
  /** `muted` (default) or `secondary` text colour for the description. */
  descriptionTone?: 'muted' | 'secondary';
  /** Page-level actions (buttons, a Menu). The primary action of the page goes first. */
  actions?: ReactNode;
  /** `sm` = 30px, `md` = 32px title (default), `lg` = 34px. Applies to the `brand` variant. */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Title font: `brand` (Alegreya Sans SC 800, default), `plain` (IBM Plex Sans 600 28px, as on Import) or
   * `subtitle` (Alegreya Sans SC 700 26px, secondary text, after a leading badge, as on Tests) or
   * `mono` (JetBrains Mono 600 24px, an operation path, as on Behavior).
   */
  variant?: 'brand' | 'plain' | 'subtitle' | 'mono';
  /** Vertical alignment of the actions: `end` (default, bottom-aligned with the description) or `start`. */
  align?: 'end' | 'start';
}

/**
 * Renders the ONLY `<h1>` of the page. It is focusable (`tabindex="-1"`) so `usePageTitle` can move
 * focus to it when the route changes. Section headings below it are `<h2>`.
 * The wrapper is a `div`, not a `header`, so the page has exactly one banner landmark (the top bar).
 */
export function PageHeader({ title, breadcrumb, breadcrumbSeparator = '›', notice, meta, badge, leading, description, descriptionWidth, descriptionTone = 'muted', actions, size = 'md', variant = 'brand', align = 'end' }: PageHeaderProps) {
  return (
    <div className="demo-page-header" data-align={align}>
      {breadcrumb && breadcrumb.length > 0 ? (
        <nav aria-label="Breadcrumb" className="demo-breadcrumb">
          <ol>
            {breadcrumb.map((c, i) => {
              const last = i === breadcrumb.length - 1;
              return (
                <li key={i}>
                  {i > 0 ? (
                    <span aria-hidden="true" className="demo-breadcrumb-sep">
                      {breadcrumbSeparator === 'chevron' ? <Icon name="chevron" size={12} /> : breadcrumbSeparator}
                    </span>
                  ) : null}
                  {c.to && !last ? <Link to={c.to}>{c.label}</Link> : <span aria-current={last ? 'page' : undefined}>{c.label}</span>}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}
      {notice}
      <div className="demo-page-header-row">
        <div className="demo-page-header-text">
          <div className="demo-page-title-row" data-leading={leading ? '' : undefined}>
            {leading}
            <h1 id={PAGE_TITLE_ID} tabIndex={-1} className="demo-page-title" data-size={size} data-variant={variant}>
              {title}
            </h1>
            {meta ? <span className="demo-page-meta">{meta}</span> : null}
            {badge}
          </div>
          {description ? (
            <p className="demo-page-description" data-tone={descriptionTone} style={descriptionWidth ? { maxWidth: descriptionWidth } : undefined}>
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="demo-page-actions">{actions}</div> : null}
      </div>
    </div>
  );
}
