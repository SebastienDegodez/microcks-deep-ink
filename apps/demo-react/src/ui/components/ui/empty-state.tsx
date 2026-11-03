// Deep Ink · empty-state@0.2.0 · copied from packages/registry. You own this file.
import { useId, type HTMLAttributes, type ReactNode } from 'react';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: string;
  /** Heading level of the title (1-6). Keep the page heading order sequential. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  actions?: ReactNode;
}

export function EmptyState({ title, headingLevel = 2, actions, className, children, ...rest }: EmptyStateProps) {
  const id = useId();
  const Heading = `h${headingLevel}` as 'h2';
  return (
    <section {...rest} className={['empty', className].filter(Boolean).join(' ')} aria-labelledby={id}>
      <Heading className="empty-title" id={id}>
        {title}
      </Heading>
      {children ? <div className="empty-body">{children}</div> : null}
      {actions ? <div className="empty-actions">{actions}</div> : null}
    </section>
  );
}
