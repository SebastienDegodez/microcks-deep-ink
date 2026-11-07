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
  /** The cells of this column are row headers (`<th scope="row">`) that name their row. */
  rowHeader?: boolean;
  /** Column width (any CSS length: `116px`, `31%`), set on its header. Pair it with `layout="fixed"`. */
  width?: string;
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
  /** `upper` (default): uppercase 11px headers. `sentence`: sentence-case 12px headers, top-aligned cells, tabular figures. */
  headerCase?: 'upper' | 'sentence';
  /** Tone of a row: `failed` sits on the surface fill, `danger` on the danger tint (an unmet row), `idle` is dimmed with the muted text colour. Write the state in a cell too. */
  rowTone?: (row: T) => 'failed' | 'danger' | 'idle' | undefined;
  /** `true` (default): the wrapper is a focusable region that scrolls. `false`: a plain wrapper, no region and no
   * tab stop, for a table that never overflows (usually `layout="fixed"`); overflowing content is clipped. */
  scroll?: boolean;
  /** `auto` (default) sizes columns from their content. `fixed`: `table-layout: fixed`, columns take their `width`
   * and long cell content wraps anywhere. */
  layout?: 'auto' | 'fixed';
  /** Makes the row header of each row a toggle button (`aria-pressed`, true on `selectedKey`) that selects the row.
   * Needs a `rowHeader` column; ignored on a cell that holds the row link. */
  onRowSelect?: (row: T) => void;
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

function nextSort(sort: SortState | undefined, key: string): SortState {
  return { key, direction: sort?.key === key && sort.direction === 'ascending' ? 'descending' : 'ascending' };
}

function HeaderCell<T>({ column: c, sort, onSortChange }: { column: DataTableColumn<T>; sort?: SortState; onSortChange?: (sort: SortState) => void }) {
  const active = sort?.key === c.key ? sort.direction : undefined;
  return (
    <th scope="col" data-align={c.align === 'end' ? 'end' : undefined} aria-sort={c.sortable ? active : undefined} style={c.width ? { width: c.width } : undefined}>
      {c.sortable ? (
        <button type="button" className="table-sort" onClick={() => onSortChange?.(nextSort(sort, c.key))}>
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
}

interface CellContentArgs<T> {
  content: ReactNode;
  row: T;
  /** Set on the first cell of a linked row. */
  linkHref: string | undefined;
  /** Row header of a selectable table. */
  pickable: boolean;
  /** First cell: says "Selected" to assistive technology. */
  markSelected: boolean;
  selected: boolean;
  renderRowLink?: (row: T, props: RowLinkProps) => ReactNode;
  onRowSelect?: (row: T) => void;
}

/** What goes inside a body cell: the row link, the row toggle, or the plain content. */
function cellContent<T>({ content, row, linkHref, pickable, markSelected, selected, renderRowLink, onRowSelect }: CellContentArgs<T>): ReactNode {
  if (linkHref !== undefined) {
    const props: RowLinkProps = { className: 'table-rowlink', href: linkHref, 'aria-current': selected ? 'true' : undefined, children: content };
    return renderRowLink ? (
      renderRowLink(row, props)
    ) : (
      <a className={props.className} href={props.href} aria-current={props['aria-current']}>
        {content}
      </a>
    );
  }
  if (pickable && onRowSelect) {
    return (
      <button type="button" className="table-pick" aria-pressed={selected} onClick={() => onRowSelect(row)}>
        {content}
      </button>
    );
  }
  if (markSelected && selected) {
    return (
      <>
        <span className="sr-only">Selected: </span>
        {content}
      </>
    );
  }
  return content;
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
  headerCase = 'upper',
  rowTone,
  scroll = true,
  layout = 'auto',
  onRowSelect,
  className,
}: DataTableProps<T>) {
  const captionId = useId();
  const keyOf = (row: T) => (typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey]));

  const cellValue = (row: T, col: DataTableColumn<T>): ReactNode => {
    if (col.render) return col.render(row);
    const v = (row as Record<string, unknown>)[col.key];
    return v === undefined || v === null ? '' : String(v);
  };

  const sortedColumn = sort ? columns.find((c) => c.key === sort.key) : undefined;

  return (
    <div className={['table-wrap', className].filter(Boolean).join(' ')} {...(scroll ? { role: 'region', 'aria-labelledby': captionId, tabIndex: 0 } : { 'data-scroll': 'false' })}>
      <table className="table" data-density={density} data-header={headerCase === 'sentence' ? 'sentence' : undefined} data-layout={layout === 'fixed' ? 'fixed' : undefined}>
        <caption id={captionId} className={captionHidden ? 'sr-only' : undefined}>
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <HeaderCell key={c.key} column={c} sort={sort} onSortChange={onSortChange} />
            ))}
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
                <tr key={key} data-selected={selected ? '' : undefined} data-tone={rowTone?.(row)}>
                  {columns.map((c, i) => {
                    const inner = cellContent({
                      content: cellValue(row, c),
                      row,
                      linkHref: i === 0 ? href : undefined,
                      pickable: Boolean(c.rowHeader && onRowSelect),
                      markSelected: i === 0,
                      selected,
                      renderRowLink,
                      onRowSelect,
                    });
                    return (
                      c.rowHeader ? (
                        <th key={c.key} scope="row" data-align={c.align === 'end' ? 'end' : undefined} data-mono={c.mono ? '' : undefined} data-nowrap={c.nowrap ? '' : undefined}>
                          {inner}
                        </th>
                      ) : (
                        <td key={c.key} data-align={c.align === 'end' ? 'end' : undefined} data-mono={c.mono ? '' : undefined} data-nowrap={c.nowrap ? '' : undefined}>
                          {inner}
                        </td>
                      )
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
