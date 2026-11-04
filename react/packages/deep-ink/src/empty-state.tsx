import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from './icon';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: string;
  /** Heading level of the title (1-6). Keep the page heading order sequential. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Decorative 40px icon above the title ("search-x" for no results). */
  icon?: IconName;
  /** `center` (default) or `start`. */
  align?: 'center' | 'start';
  actions?: ReactNode;
}

export function EmptyState({ title, headingLevel = 2, icon, align = 'center', actions, className, children, ...rest }: EmptyStateProps) {
  const id = useId();
  const Heading = `h${headingLevel}` as 'h2';
  return (
    <section {...rest} className={['empty', className].filter(Boolean).join(' ')} aria-labelledby={id} data-align={align}>
      {icon ? (
        <span className="empty-icon">
          <Icon name={icon} size={40} />
        </span>
      ) : null}
      <Heading className="empty-title" id={id}>
        {title}
      </Heading>
      {children ? <div className="empty-body">{children}</div> : null}
      {actions ? <div className="empty-actions">{actions}</div> : null}
    </section>
  );
}
