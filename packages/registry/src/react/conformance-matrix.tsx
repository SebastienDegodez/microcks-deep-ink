import type { CSSProperties, HTMLAttributes } from 'react';
import { Icon, type IconName } from './icon';

export type CheckResult = 'pass' | 'fail' | 'warn' | 'running' | 'queued';

export interface MatrixColumn {
  id: string;
  label: string;
  /** Small text under the label: "preferred · SSE". */
  sub?: string;
}

export interface MatrixCell {
  /** Column of the cell. Omit it for a cell that spans every column. */
  columnId?: string;
  result: CheckResult;
  /** Duration, shown once the check has finished. */
  duration?: string;
}

export interface MatrixRow {
  id: string;
  label: string;
  sub?: string;
  /** Mono label (an identifier). */
  mono?: boolean;
  /** One cell per column, or a single cell without `columnId` that spans every column. */
  cells: MatrixCell[];
}

export interface MatrixGroup {
  id: string;
  label: string;
  sub?: string;
  rows: MatrixRow[];
}

export interface MatrixFooterCell {
  text: string;
  tone?: 'success' | 'danger';
}

export interface ConformanceMatrixProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Accessible name of the table. */
  caption: string;
  columns: MatrixColumn[];
  groups: MatrixGroup[];
  /** Summary row, one cell per column ("Conversations passed"). */
  footer?: { label: string; cells: MatrixFooterCell[] };
  /** Key of the selected cell, see `cellKey`. */
  selectedKey?: string;
  /** Finished cells become buttons. Called with `undefined` when the selected cell is pressed again. */
  onSelectCell?: (key: string | undefined) => void;
}

const RESULT: Record<CheckResult, { word: string; icon: IconName }> = {
  pass: { word: 'Passed', icon: 'check' },
  fail: { word: 'Failed', icon: 'cross' },
  warn: { word: 'Warning', icon: 'warning' },
  running: { word: 'Running', icon: 'running' },
  queued: { word: 'Queued', icon: 'circle' },
};

/** Key of a cell: `<rowId>|<columnId>`, or `<rowId>|*` for a cell that spans every column. */
export function cellKey(rowId: string, columnId?: string): string {
  return `${rowId}|${columnId ?? '*'}`;
}

/**
 * Checks by columns (transports, environments). Each cell writes its result with a glyph and a word; a finished
 * cell is a button that selects it, so the detail can sit under the table. Cells that are still queued or
 * running are plain text, not disabled buttons.
 */
export function ConformanceMatrix({ caption, columns, groups, footer, selectedKey, onSelectCell, className, ...rest }: ConformanceMatrixProps) {
  const span = columns.length;
  return (
    <div {...rest} className={['matrix-wrap', className].filter(Boolean).join(' ')} role="region" aria-label={caption} tabIndex={0}>
      <table className="matrix" style={{ '--matrix-columns': span } as CSSProperties}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Check</th>
            {columns.map((c) => (
              <th key={c.id} scope="col">
                <span>{c.label}</span>
                {c.sub ? <span className="matrix-sub">{c.sub}</span> : null}
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((g) => (
          <tbody key={g.id}>
            <tr className="matrix-group">
              <th scope="rowgroup" colSpan={span + 1}>
                {g.label}
                {g.sub ? <span className="matrix-sub"> · {g.sub}</span> : null}
              </th>
            </tr>
            {g.rows.map((r) => (
              <tr key={r.id}>
                <th scope="row" data-mono={r.mono ? '' : undefined}>
                  <span>{r.label}</span>
                  {r.sub ? <span className="matrix-sub">{r.sub}</span> : null}
                </th>
                {r.cells.map((cell) => {
                  const key = cellKey(r.id, cell.columnId);
                  const col = columns.find((c) => c.id === cell.columnId);
                  const finished = cell.result === 'pass' || cell.result === 'fail' || cell.result === 'warn';
                  const look = RESULT[cell.result];
                  const body = (
                    <>
                      <Icon name={look.icon} size={14} />
                      <span>{look.word}</span>{' '}
                      {finished && cell.duration ? <span className="matrix-ms">{cell.duration}</span> : null}
                    </>
                  );
                  const selected = selectedKey === key;
                  return (
                    <td key={key} colSpan={cell.columnId ? 1 : span} data-result={cell.result}>
                      {finished && onSelectCell ? (
                        <button
                          type="button"
                          className="matrix-cell"
                          aria-pressed={selected}
                          onClick={() => onSelectCell(selected ? undefined : key)}
                        >
                          <span className="sr-only">{`${col ? `${col.label} × ` : ''}${r.label}:`}</span>{' '}
                          {body}
                        </button>
                      ) : (
                        <span className="matrix-cell">{body}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        ))}
        {footer ? (
          <tfoot>
            <tr>
              <th scope="row">{footer.label}</th>
              {footer.cells.map((c, i) => (
                <td key={i} data-tone={c.tone}>
                  {c.text}
                </td>
              ))}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
