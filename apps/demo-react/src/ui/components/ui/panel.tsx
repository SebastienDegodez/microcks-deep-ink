// Deep Ink · panel@0.2.0 · copied from packages/registry. You own this file.
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
  /** Root element. */
  as?: 'section' | 'div' | 'article' | 'aside';
  ref?: Ref<HTMLElement>;
}

/**
 * Panel on `canvas` with a hairline border. Elevation is a lighter ink, never a shadow.
 */
export function Panel({ title, headingLevel = 2, actions, flush, as = 'section', className, children, ref, ...rest }: PanelProps) {
  const titleId = useId();
  const Root = as as ElementType;
  const Heading = `h${headingLevel}` as ElementType;
  return (
    <Root
      ref={ref}
      {...rest}
      className={['di-panel', className].filter(Boolean).join(' ')}
      data-flush={flush ? '' : undefined}
      aria-labelledby={title ? titleId : rest['aria-labelledby']}
    >
      {title || actions ? (
        <div className="di-panel-header">
          {title ? (
            <Heading className="di-panel-title" id={titleId}>
              {title}
            </Heading>
          ) : null}
          {actions ? <div className="di-panel-actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className="di-panel-body">{children}</div>
    </Root>
  );
}
