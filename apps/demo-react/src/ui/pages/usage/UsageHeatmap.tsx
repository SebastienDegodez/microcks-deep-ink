import { useId, useState } from 'react';
import { WEEKDAY_HEADERS, formatCount, heatmapWeeks, type UsageView } from '@/domain/observe';
import { Panel } from '@/ui/components/ui/panel';
import { useRovingSelection } from '../tests/roving';
import './heatmap.css';

/** Weekday labels of the heatmap rows, every other day as in the prototype. */
const HEAT_ROW_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'] as const;

/** Daily calendar of the last 12 weeks: one button per day, 4 heat steps, legend and three key figures. */
export function UsageHeatmap({ view }: { view: UsageView }) {
  const { heatmap } = view;
  const titleId = useId();
  const [sel, setSel] = useState(heatmap.defaultSelected);
  const byPos = new Map(heatmap.cells.map((c) => [`${c.week}:${c.weekday}`, c.index]));
  const roving = useRovingSelection(setSel, (i, key) => {
    const cell = heatmap.cells.find((c) => c.index === i);
    if (!cell) return undefined;
    const move: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
    const delta = move[key];
    return delta ? byPos.get(`${cell.week + delta[0]}:${cell.weekday + delta[1]}`) : undefined;
  });
  const cell = heatmap.cells.find((c) => c.index === sel);
  const weeks = heatmapWeeks(heatmap.cells);
  const lastDay = heatmap.cells.length - 1;
  return (
    <Panel className="us-heat-card" padding="lg" aria-labelledby={titleId}>
      <div className="us-heat-head">
        <h2 id={titleId}>Daily invocations · last 12 weeks</h2>
        <span>{heatmap.subtitle}</span>
      </div>
      <div
        className="us-heat"
        role="group"
        aria-label="Calendar heatmap, one button per day. Use the arrow keys to move between days."
        style={{ ['--heat-weeks' as string]: heatmap.months.length }}
      >
        {heatmap.months.map((m, w) => (
          <span key={`m-${w}`} className="us-heat-month" aria-hidden="true" style={{ gridColumn: w + 2, gridRow: 1 }}>
            {m}
          </span>
        ))}
        {HEAT_ROW_LABELS.map((d, r) => (
          <span key={`d-${r}`} className="us-heat-weekday" aria-hidden="true" style={{ gridColumn: 1, gridRow: r + 2 }}>
            {d}
          </span>
        ))}
        {heatmap.cells.map((c) => (
          <button
            key={c.index}
            ref={roving.register(c.index)}
            type="button"
            className="us-day"
            data-level={c.level}
            style={{ gridColumn: c.week + 2, gridRow: c.weekday + 2 }}
            aria-pressed={c.index === sel}
            tabIndex={c.index === sel ? 0 : -1}
            aria-label={`${c.name}: ${formatCount(c.value)} invocations`}
            onClick={() => setSel(c.index)}
            onKeyDown={roving.onKeyDown(c.index)}
          />
        ))}
        {Array.from({ length: heatmap.months.length * 7 - heatmap.cells.length }, (_, i) => {
          const day = heatmap.cells.length + i;
          return <span key={`f-${day}`} className="us-day-future" aria-hidden="true" style={{ gridColumn: Math.floor(day / 7) + 2, gridRow: (day % 7) + 2 }} />;
        })}
      </div>
      <div className="us-heat-foot">
        <span aria-live="polite">
          {cell ? (
            <>
              <span className="us-heat-sel-day">
                {cell.name}
                {cell.index === lastDay ? ` ${heatmap.todayNote}` : ''}
              </span>{' '}
              <span className="us-heat-sel-value">{formatCount(cell.value)} invocations</span>
            </>
          ) : null}
        </span>
        <span className="us-heat-legend" aria-hidden="true">
          Less
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className="us-heat-swatch" data-level={l === 0 ? 'none' : l - 1} />
          ))}
          More
        </span>
      </div>
      <dl className="facts">
        <div>
          <dt>12-week total</dt>
          <dd>{formatCount(heatmap.total)}</dd>
        </div>
        <div>
          <dt>Weekday average</dt>
          <dd>{formatCount(heatmap.weekdayAverage)}</dd>
        </div>
        <div>
          <dt>Busiest day</dt>
          <dd>{heatmap.busiest}</dd>
        </div>
      </dl>
      <table className="sr-only">
        <caption>Invocations per week and weekday</caption>
        <thead>
          <tr>
            <th scope="col">Week of</th>
            {WEEKDAY_HEADERS.map((d) => (
              <th scope="col" key={d}>
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.week}>
              <th scope="row">{w.week}</th>
              {w.values.map((v, i) => (
                <td key={i}>{v === null ? 'not yet' : formatCount(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
