import type { Snippet } from 'svelte';

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
  /** Custom cell content, a snippet given the row. Defaults to `String(row[key])`. */
  render?: Snippet<[T]>;
  /** Renders the header as a sort button. */
  sortable?: boolean;
}

/** Given to `renderRowLink`: spread them on your link and render `children` (the cell content) inside it. */
export interface RowLinkProps {
  class: string;
  href: string;
  'aria-current'?: 'true';
  children: Snippet;
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
