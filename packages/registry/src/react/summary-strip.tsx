import { Fragment } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

export interface SummaryStripPart {
  text: ReactNode;
  /** `value` (default): mono --text-secondary. `label`: muted sans. */
  kind?: 'value' | 'label';
  /** Draws a separator before this part. */
  sep?: boolean;
}

export interface SummaryStripProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  parts?: SummaryStripPart[];
  /** `roomy`: 10px between wrapped rows (Service, Agent). */
  gap?: 'normal' | 'roomy';
  /** `text`: values in --text instead of --text-secondary (Service). */
  values?: 'secondary' | 'text';
  /** Free content after the parts (links, a code box). */
  children?: ReactNode;
}

/** Key facts in one bordered row with decorative separators. Pass `role="note"` and `aria-label` for a page summary. */
export function SummaryStrip({ parts = [], gap = 'normal', values = 'secondary', className, children, ...rest }: SummaryStripProps) {
  return (
    <div
      {...rest}
      className={['summary-strip', className].filter(Boolean).join(' ')}
      data-gap={gap === 'roomy' ? 'roomy' : undefined}
      data-values={values === 'text' ? 'text' : undefined}
    >
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p.sep ? <span className="summary-strip-sep" aria-hidden="true" /> : null}
          <span className={p.kind === 'label' ? 'summary-strip-label' : 'summary-strip-value'}>{p.text}</span>
        </Fragment>
      ))}
      {children}
    </div>
  );
}

/** A decorative 1 x 16px separator, for strips built from children. */
export function SummaryStripSep() {
  return <span className="summary-strip-sep" aria-hidden="true" />;
}
