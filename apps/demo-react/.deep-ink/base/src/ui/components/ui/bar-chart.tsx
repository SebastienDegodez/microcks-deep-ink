// Deep Ink · bar-chart@0.2.0 · copied from packages/registry. You own this file.
import { useRef } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';

export type BarTone = 'action' | 'success' | 'danger' | 'warning' | 'running';

export interface BarChartBar {
  id: string;
  value: number;
  /** Full accessible name: "Run #118, failed, 1.84 s, 6/7 samples passed". */
  description: string;
  /** X label under the bar; empty to skip it. */
  label?: string;
  tone?: BarTone;
  /** A slot still to come: a dashed frame, not selectable. */
  future?: boolean;
  /** Dimmed (outside the filters); stays selectable. */
  faded?: boolean;
  /** Text above the bar (a capped value: "12 s"). */
  cap?: string;
}

export interface BarChartTable {
  caption: string;
  columns: string[];
  /** One row per bar; the first cell is the row header. */
  rows: string[][];
}

export interface BarChartProps {
  /** Name of the bar group, with how to move: "Runs, oldest to newest. Use the arrow keys to move between bars." */
  label: string;
  bars: BarChartBar[];
  /** Value of a full-height bar. */
  max: number;
  selectedId?: string;
  onSelect: (id: string) => void;
  /** `outline` (default): the selected bar is outlined. `fill`: it takes the --link fill. */
  selection?: 'outline' | 'fill';
  /** Left axis labels, top to bottom ("3 s", "1.5 s", "0"). */
  ticks?: string[];
  /** Right axis labels, top to bottom, in --link (a second measure, like the overlay line). */
  ticksEnd?: string[];
  /** Dashed gridlines, as fractions from the top (default 0 and .5). */
  grid?: number[];
  /** Plot height in px (160). */
  height?: number;
  /** Gap between bars in px (4). */
  gap?: number;
  /** Smallest visible bar, in % (2). */
  minHeight?: number;
  /** Decorative layer over the bars (an SVG line). */
  overlay?: ReactNode;
  /** The text equivalent, rendered as a visually hidden table. */
  table: BarChartTable;
  className?: string;
}

/** Selectable bar chart: one button per bar, one tab stop, arrow keys, and a hidden table. */
export function BarChart({
  label,
  bars,
  max,
  selectedId,
  onSelect,
  selection = 'outline',
  ticks,
  ticksEnd,
  grid = [0, 0.5],
  height,
  gap,
  minHeight = 2,
  overlay,
  table,
  className,
}: BarChartProps) {
  const refs = useRef(new Map<number, HTMLButtonElement>());
  const selectable = bars.map((b, i) => (b.future ? -1 : i)).filter((i) => i >= 0);
  const selIndex = bars.findIndex((b) => b.id === selectedId && !b.future);
  const tabStop = selIndex >= 0 ? selIndex : (selectable[selectable.length - 1] ?? -1);
  const vars: Record<string, string> = {};
  if (height) vars['--bar-chart-height'] = `${height}px`;
  if (gap !== undefined) vars['--bar-chart-gap'] = `${gap}px`;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const pos = selectable.indexOf(index);
    const to =
      e.key === 'ArrowRight' ? selectable[Math.min(pos + 1, selectable.length - 1)]
      : e.key === 'ArrowLeft' ? selectable[Math.max(pos - 1, 0)]
      : e.key === 'Home' ? selectable[0]
      : e.key === 'End' ? selectable[selectable.length - 1]
      : undefined;
    if (to === undefined) return;
    e.preventDefault();
    const bar = bars[to];
    if (bar) onSelect(bar.id);
    refs.current.get(to)?.focus();
  };

  const pct = (b: BarChartBar) => (max <= 0 ? 0 : Math.min(100, Math.max(b.value > 0 ? minHeight : 0, (b.value / max) * 100)));

  return (
    <>
      <div className={['bar-chart', className].filter(Boolean).join(' ')} data-selection={selection} style={vars as CSSProperties}>
        {ticks ? (
          <div className="bar-chart-axis" aria-hidden="true">
            {ticks.map((t, i) => <span key={i}>{t}</span>)}
          </div>
        ) : null}
        <div className="bar-chart-main">
          <div className="bar-chart-plot">
            {grid.map((g) => (
              <div key={g} className="bar-chart-grid" aria-hidden="true" style={{ top: `${g * 100}%` }} />
            ))}
            <div className="bar-chart-bars" role="group" aria-label={label}>
              {bars.map((b, i) =>
                b.future ? (
                  <div key={b.id} className="bar-chart-cell" aria-hidden="true">
                    <span className="bar-chart-future" />
                  </div>
                ) : (
                  <div key={b.id} className="bar-chart-cell" data-faded={b.faded ? '' : undefined}>
                    {b.cap ? (
                      <span className="bar-chart-cap" aria-hidden="true" style={{ bottom: `calc(${pct(b)}% + 2px)` }}>
                        {b.cap}
                      </span>
                    ) : null}
                    <button
                      ref={(el) => {
                        if (el) refs.current.set(i, el);
                        else refs.current.delete(i);
                      }}
                      type="button"
                      className="bar-chart-bar"
                      aria-pressed={i === selIndex}
                      aria-label={b.description}
                      tabIndex={i === tabStop ? 0 : -1}
                      onClick={() => onSelect(b.id)}
                      onKeyDown={(e) => onKeyDown(e, i)}
                    >
                      <span className="bar-chart-fill" data-tone={b.tone && b.tone !== 'action' ? b.tone : undefined} style={{ height: `${pct(b)}%` }} />
                    </button>
                  </div>
                ),
              )}
            </div>
            {overlay ? (
              <div className="bar-chart-overlay" aria-hidden="true">
                {overlay}
              </div>
            ) : null}
          </div>
          <div className="bar-chart-labels" aria-hidden="true">
            {bars.map((b, i) => (
              <span key={b.id} data-selected={i === selIndex ? '' : undefined}>
                {b.label ?? ''}
              </span>
            ))}
          </div>
        </div>
        {ticksEnd ? (
          <div className="bar-chart-axis" data-side="end" aria-hidden="true">
            {ticksEnd.map((t, i) => <span key={i}>{t}</span>)}
          </div>
        ) : null}
      </div>
      <table className="sr-only">
        <caption>{table.caption}</caption>
        <thead>
          <tr>
            {table.columns.map((c) => (
              <th key={c} scope="col">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (j === 0 ? <th key={j} scope="row">{cell}</th> : <td key={j}>{cell}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
