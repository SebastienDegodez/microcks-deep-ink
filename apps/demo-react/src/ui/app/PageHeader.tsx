import type { ReactNode } from 'react';
import { PAGE_TITLE_ID } from './usePageTitle';

export interface PageHeaderProps {
  /** The page's single `<h1>`. */
  title: string;
  /** Small label above the title (a breadcrumb-like context: "Workflows · pastry-workflows.arazzo.yaml"). */
  eyebrow?: ReactNode;
  /** Badge next to the title (an ApiBadge, a StatusBadge...). */
  badge?: ReactNode;
  /** Page-level actions (buttons, a Menu). The primary action of the page goes first. */
  actions?: ReactNode;
}

/**
 * Renders the ONLY `<h1>` of the page. It is focusable (`tabindex="-1"`) so `usePageTitle` can move
 * focus to it when the route changes. Section headings below it are `<h2>`.
 * The wrapper is a `div`, not a `header`, so the page has exactly one banner landmark (the top bar).
 */
export function PageHeader({ title, eyebrow, badge, actions }: PageHeaderProps) {
  return (
    <div className="demo-page-header">
      <div className="demo-page-header-text">
        {eyebrow ? <p className="demo-eyebrow">{eyebrow}</p> : null}
        <div className="demo-page-title-row">
          <h1 id={PAGE_TITLE_ID} tabIndex={-1} className="demo-page-title">
            {title}
          </h1>
          {badge}
        </div>
      </div>
      {actions ? <div className="demo-page-actions">{actions}</div> : null}
    </div>
  );
}
