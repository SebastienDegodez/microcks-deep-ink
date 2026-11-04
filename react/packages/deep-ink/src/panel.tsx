import { useId } from 'react';
import type { ElementType, HTMLAttributes, ReactNode, Ref } from 'react';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Visible heading. When set, the panel is labelled by it. */
  title?: ReactNode;
  /** Level of the title heading. Keep the page outline ordered. */
  headingLevel?: HeadingLevel;
  /** Controls aligned to the end of the header. */
  actions?: ReactNode;
  /** Removes the body padding, for tables and lists. */
  flush?: boolean;
  /** `heading` (16px, default) or `label` (12px uppercase, muted). */
  titleStyle?: 'heading' | 'label';
  /** `md` = 16px padding (default), `lg` = 20px. */
  padding?: 'md' | 'lg';
  /** Root element. */
  as?: 'section' | 'div' | 'article' | 'aside';
  ref?: Ref<HTMLElement>;
}

/**
 * Panel on `canvas` with a hairline border. Elevation is a lighter ink, never a shadow.
 */
export function Panel({ title, headingLevel = 2, actions, flush, titleStyle = 'heading', padding = 'md', as = 'section', className, children, ref, ...rest }: PanelProps) {
  const titleId = useId();
  const Root = as as ElementType;
  const Heading = `h${headingLevel}` as ElementType;
  return (
    <Root
      ref={ref}
      {...rest}
      className={['panel', className].filter(Boolean).join(' ')}
      data-flush={flush ? '' : undefined}
      data-title={titleStyle === 'label' ? 'label' : undefined}
      data-pad={padding === 'lg' ? 'lg' : undefined}
      aria-labelledby={title ? titleId : rest['aria-labelledby']}
    >
      {title || actions ? (
        <div className="panel-header">
          {title ? (
            <Heading className="panel-title" id={titleId}>
              {title}
            </Heading>
          ) : null}
          {actions ? <div className="panel-actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className="panel-body">{children}</div>
    </Root>
  );
}
