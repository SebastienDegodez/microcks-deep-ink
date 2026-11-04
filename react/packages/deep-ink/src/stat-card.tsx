import { useId } from 'react';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';

export interface StatCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Small uppercase heading: "Mock invocations · 7 days". */
  title: ReactNode;
  /** Level of the title heading. Keep the page outline ordered. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** A link at the end of the header ("Catalogue", "Details"). */
  action?: ReactNode;
  /** The big figure, always written as text: "638", "78%". */
  value: ReactNode;
  /** Text after the figure on the same line: "requests", "29 operations". */
  unit?: ReactNode;
  /** Colour of the figure. The meaning must also be in the text. */
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}

/** One key figure: a small heading, a big number with its unit, and optional detail under it. */
export function StatCard({ title, headingLevel = 2, action, value, unit, tone = 'neutral', className, children, ...rest }: StatCardProps) {
  const id = useId();
  const Heading = `h${headingLevel}` as ElementType;
  return (
    <section {...rest} className={['stat-card', className].filter(Boolean).join(' ')} aria-labelledby={id} data-tone={tone}>
      <div className="stat-card-head">
        <Heading className="stat-card-title" id={id}>
          {title}
        </Heading>
        {action ? <span className="stat-card-action">{action}</span> : null}
      </div>
      <p className="stat-card-figure">
        <span className="stat-card-value">{value}</span>
        {unit ? <span className="stat-card-unit">{unit}</span> : null}
      </p>
      {children ? <div className="stat-card-body">{children}</div> : null}
    </section>
  );
}

export interface StatGridProps extends HTMLAttributes<HTMLElement> {
  /** Accessible name of the group: "Key figures". */
  label: string;
}

/** Grid of key figures, each card at least 220px wide. */
export function StatGrid({ label, className, children, ...rest }: StatGridProps) {
  return (
    <section {...rest} aria-label={label} className={['stat-grid', className].filter(Boolean).join(' ')}>
      {children}
    </section>
  );
}
