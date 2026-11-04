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
  /** The page's single `<h1>`. With `variant="badge"` it is an `ApiBadge` (size `xl`): the badge is the title. */
  title: ReactNode;
  /** Trail of parent pages, rendered as `<nav aria-label="Breadcrumb">` above the title row. */
  breadcrumb?: Crumb[];
  /** Breadcrumb separator: `›` (default, most screens), `/` (Service) or `chevron` (a 12px icon, Workflow). */
  breadcrumbSeparator?: '›' | '/' | 'chevron';
  /** Mono pill beside the title ("11 services · 29 operations"). */
  meta?: ReactNode;
  /** Badge next to the title (an ApiBadge, a StatusBadge...). */
  badge?: ReactNode;
  /** Lead paragraph under the title row (14px, max 720px). */
  description?: ReactNode;
  /** `muted` (default) or `secondary` text colour for the description. */
  descriptionTone?: 'muted' | 'secondary';
  /** Page-level actions (buttons, a Menu). The primary action of the page goes first. */
  actions?: ReactNode;
  /** `md` = 32px title (default), `lg` = 34px. Applies to the `brand` variant. */
  size?: 'md' | 'lg';
  /**
   * Title font: `brand` (Alegreya Sans SC 800, default), `plain` (IBM Plex Sans 600 28px, as on Import) or `badge`
   * (the title is an api-badge, as on Service, Agent and Workflow; 15px secondary description).
   */
  variant?: 'brand' | 'plain' | 'badge';
  /** Vertical alignment of the actions: `end` (default, bottom-aligned with the description) or `start`. */
  align?: 'end' | 'start';
  /** Extra rows under the description, in the title column (labels, proof badges). */
  children?: ReactNode;
}

/**
 * Renders the ONLY `<h1>` of the page. It is focusable (`tabindex="-1"`) so `usePageTitle` can move
 * focus to it when the route changes. Section headings below it are `<h2>`.
 * The wrapper is a `div`, not a `header`, so the page has exactly one banner landmark (the top bar).
 */
export function PageHeader({ title, breadcrumb, breadcrumbSeparator = '›', meta, badge, description, descriptionTone = 'muted', actions, size = 'md', variant = 'brand', align = 'end', children }: PageHeaderProps) {
  return (
    <div className="demo-page-header" data-align={align} data-variant={variant}>
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
      <div className="demo-page-header-row">
        <div className="demo-page-header-text">
          <div className="demo-page-title-row">
            <h1 id={PAGE_TITLE_ID} tabIndex={-1} className="demo-page-title" data-size={size} data-variant={variant}>
              {title}
            </h1>
            {meta ? <span className="demo-page-meta">{meta}</span> : null}
            {badge}
          </div>
          {description ? (
            <p className="demo-page-description" data-tone={descriptionTone}>
              {description}
            </p>
          ) : null}
          {children}
        </div>
        {actions ? <div className="demo-page-actions">{actions}</div> : null}
      </div>
    </div>
  );
}
