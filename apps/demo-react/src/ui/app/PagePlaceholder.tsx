import { useLocation, useParams } from 'react-router';
import { PageHeader } from './PageHeader';
import { usePageTitle } from './usePageTitle';

export interface PagePlaceholderProps {
  /** Prototype `<title>`, e.g. "Cockpit · Microcks". */
  title: string;
  /** Prototype number and name from the screen map, e.g. "03 · Cockpit". */
  screen: string;
  /** Phase-2 work package that implements the page. */
  owner: 'WP7' | 'WP8' | 'WP9' | 'WP3';
  /** What the page must reproduce (one line from the plan). */
  summary: string;
}

/**
 * Phase-1 stand-in for a screen: one `<h1>`, a document title, and the route it answers.
 * The phase-2 owner REPLACES the page file entirely (this component is then no longer used).
 */
export function PagePlaceholder({ title, screen, owner, summary }: PagePlaceholderProps) {
  usePageTitle(title);
  const params = useParams();
  const { search } = useLocation();
  const entries = Object.entries(params).filter(([key, value]) => key !== '*' && value !== undefined);
  return (
    <>
      <PageHeader title={title.replace(/ · Microcks$/, '')} eyebrow={`Screen ${screen}`} />
      <section aria-labelledby="placeholder-heading" className="demo-placeholder">
        <h2 id="placeholder-heading">Placeholder</h2>
        <p>{summary}</p>
        <p>
          Implemented in phase 2 by {owner}. This page answers the route
          {entries.length > 0 ? ' with these parameters:' : '.'}
        </p>
        {entries.length > 0 ? (
          <ul>
            {entries.map(([key, value]) => (
              <li key={key}>
                <code>{key}</code> = <code>{value}</code>
              </li>
            ))}
          </ul>
        ) : null}
        {search ? (
          <p>
            Query string: <code>{search}</code>
          </p>
        ) : null}
      </section>
    </>
  );
}
