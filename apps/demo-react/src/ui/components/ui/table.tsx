// Deep Ink · table@0.2.0 · copied from packages/registry. You own this file.
import { useId } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './icon';

export interface SortState {
  key: string;
  direction: 'ascending' | 'descending';
}

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Keeps the header for assistive technology only (an icon-only "Open" column). */
  headerHidden?: boolean;
  align?: 'start' | 'end';
  mono?: boolean;
  /** Keeps the cells of this column on one line. Cells wrap by default. */
  nowrap?: boolean;
  /** Custom cell content. Defaults to `String(row[key])`. */
  render?: (row: T) => ReactNode;
  /** Renders the header as a sort button. */
  sortable?: boolean;
}

export interface RowLinkProps {
  className: string;
  href: string;
  'aria-current'?: 'true';
  children: ReactNode;
}

export interface DataTableProps<T> {
  /** Visible table title (a real `<caption>`). */
  caption: string;
  /** Keeps the caption for assistive technology only. */
  captionHidden?: boolean;
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Unique key of a row: a property name or a function. */
  rowKey: (keyof T & string) | ((row: T) => string);
  /** Makes the first cell a link stretched over the whole row. There is no clickable `<tr>`. */
  rowHref?: (row: T) => string;
  /** Renders the row link yourself, for router links. Spread `props` on it. */
  renderRowLink?: (row: T, props: RowLinkProps) => ReactNode;
  selectedKey?: string;
  sort?: SortState;
  /** Called when a sort button is activated. The caller sorts `rows`. */
  onSortChange?: (sort: SortState) => void;
  emptyText?: string;
  density?: 'comfortable' | 'compact';
  className?: string;
}

/** Sorts a copy of `rows` by `sort`, comparing numbers numerically and anything else as text. */
export function sortRows<T>(rows: readonly T[], sort: SortState | undefined, valueOf?: (row: T, key: string) => unknown): T[] {
  if (!sort) return [...rows];
  const get = valueOf ?? ((row: T, key: string) => (row as Record<string, unknown>)[key]);
  const factor = sort.direction === 'ascending' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = get(a, sort.key);
    const y = get(b, sort.key);
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * factor;
    return String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true }) * factor;
  });
}

/**
 * Data table: real `<caption>`, `th scope`, `aria-sort`, a focusable scroll region.
 * Nothing in the markup is a clickable `<tr>`.
 */
export function DataTable<T>({
  caption,
  captionHidden,
  columns,
  rows,
  rowKey,
  rowHref,
  renderRowLink,
  selectedKey,
  sort,
  onSortChange,
  emptyText = 'Nothing here yet.',
  density = 'comfortable',
  className,
}: DataTableProps<T>) {
  const captionId = useId();
  const keyOf = (row: T) => (typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey]));

  const cellValue = (row: T, col: DataTableColumn<T>): ReactNode => {
    if (col.render) return col.render(row);
    const v = (row as Record<string, unknown>)[col.key];
    return v === undefined || v === null ? '' : String(v);
  };

  const nextSort = (key: string): SortState => ({
    key,
    direction: sort?.key === key && sort.direction === 'ascending' ? 'descending' : 'ascending',
  });

  const sortedColumn = sort ? columns.find((c) => c.key === sort.key) : undefined;

  return (
    <div className={['table-wrap', className].filter(Boolean).join(' ')} role="region" aria-labelledby={captionId} tabIndex={0}>
      <table className="table" data-density={density}>
        <caption id={captionId} className={captionHidden ? 'sr-only' : undefined}>
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key ? sort.direction : undefined;
              return (
                <th key={c.key} scope="col" data-align={c.align === 'end' ? 'end' : undefined} aria-sort={c.sortable ? active : undefined}>
                  {c.sortable ? (
                    <button type="button" className="table-sort" onClick={() => onSortChange?.(nextSort(c.key))}>
                      {c.header}
                      <Icon name={active === 'descending' ? 'arrow-down' : active === 'ascending' ? 'arrow-up' : 'dash'} size={12} />
                    </button>
                  ) : c.headerHidden ? (
                    <span className="sr-only">{c.header}</span>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="table-empty" colSpan={Math.max(columns.length, 1)}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const key = keyOf(row);
              const selected = selectedKey !== undefined && key === selectedKey;
              const href = rowHref?.(row);
              return (
                <tr key={key} data-selected={selected ? '' : undefined}>
                  {columns.map((c, i) => {
                    const content = cellValue(row, c);
                    let inner: ReactNode = content;
                    if (i === 0 && href !== undefined) {
                      const props: RowLinkProps = {
                        className: 'table-rowlink',
                        href,
                        'aria-current': selected ? 'true' : undefined,
                        children: content,
                      };
                      inner = renderRowLink ? (
                        renderRowLink(row, props)
                      ) : (
                        <a className={props.className} href={props.href} aria-current={props['aria-current']}>
                          {content}
                        </a>
                      );
                    } else if (i === 0 && selected) {
                      inner = (
                        <>
                          <span className="sr-only">Selected: </span>
                          {content}
                        </>
                      );
                    }
                    return (
                      <td key={c.key} data-align={c.align === 'end' ? 'end' : undefined} data-mono={c.mono ? '' : undefined} data-nowrap={c.nowrap ? '' : undefined}>
                        {inner}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {/* Announces a sort change; the sorted header also exposes aria-sort. */}
      <span role="status" aria-live="polite" className="sr-only">
        {sort && sortedColumn ? `Sorted by ${sortedColumn.header}, ${sort.direction}` : ''}
      </span>
    </div>
  );
}
