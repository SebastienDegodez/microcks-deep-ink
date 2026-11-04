import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export type FactTone = 'success' | 'warning' | 'danger' | 'muted';

export interface Fact {
  term: ReactNode;
  value: ReactNode;
  /** Muted 12px line under the value. */
  sub?: ReactNode;
  /** Monospace 12px value (ids, paths, versions). */
  mono?: boolean;
  /** Colour of the value. The words must carry the meaning too. */
  tone?: FactTone;
  /** React key; defaults to the term when it is a string. */
  id?: string;
}

export interface FactsProps extends Omit<HTMLAttributes<HTMLDListElement>, 'children'> {
  items?: Fact[];
  /** `rows` (default): term column + separators. `inline`: two-column grid. `columns`: term over value. */
  layout?: 'rows' | 'inline' | 'columns';
  /** Frames the list on the page background (padding 12px 14px, radius 6); `surface`: on the surface fill, padding 12px. */
  boxed?: boolean | 'surface';
  /** 14px 600 values (figures). */
  strong?: boolean;
  /** Width of the term column in `rows` (130px) and `inline` (92px): `150px`. */
  termWidth?: string;
  /** `columns` only: a fixed number of equal columns instead of auto-fit. */
  columns?: number;
  /** `sm`: 11px terms with a normal line height (Traces, Usage). `md` (default). `lg`: 14px text, 8px rows, 14px mono values (Service). */
  size?: 'sm' | 'md' | 'lg';
  /** `inline` and `columns`: the grid gap, row then column (default `8px 16px`; WorkflowRun `9px 12px`). */
  gap?: string;
  /** Extra `FactRow`s after the items. */
  children?: ReactNode;
}

export interface FactRowProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  term: ReactNode;
  sub?: ReactNode;
  mono?: boolean;
  tone?: FactTone;
  children?: ReactNode;
}

/** One term/value pair, for rich values (links, badges, buttons). */
export function FactRow({ term, sub, mono, tone, className, children, ...rest }: FactRowProps) {
  return (
    <div {...rest} className={['facts-row', className].filter(Boolean).join(' ')}>
      <dt>{term}</dt>
      <dd data-mono={mono ? '' : undefined} data-tone={tone}>
        {sub ? (
          <>
            <span>{children}</span>
            <span className="facts-sub">{sub}</span>
          </>
        ) : (
          children
        )}
      </dd>
    </div>
  );
}

/** Key/value facts of an object in a native `<dl>`. */
export function Facts({ items = [], layout = 'rows', boxed, strong, termWidth, columns, gap, size = 'md', className, style, children, ...rest }: FactsProps) {
  const vars: Record<string, string> = {};
  if (termWidth) vars['--facts-term'] = termWidth;
  if (gap) vars['--facts-gap'] = gap;
  if (columns) vars['--facts-cols'] = `repeat(${columns}, minmax(0, 1fr))`;
  return (
    <dl
      {...rest}
      className={['facts', className].filter(Boolean).join(' ')}
      data-layout={layout === 'rows' ? undefined : layout}
      data-boxed={boxed === 'surface' ? 'surface' : boxed ? '' : undefined}
      data-strong={strong ? '' : undefined}
      data-size={size === 'md' ? undefined : size}
      style={{ ...(vars as CSSProperties), ...style }}
    >
      {items.map((f, i) => (
        <FactRow key={f.id ?? (typeof f.term === 'string' ? f.term : i)} term={f.term} sub={f.sub} mono={f.mono} tone={f.tone}>
          {f.value}
        </FactRow>
      ))}
      {children}
    </dl>
  );
}
