import { useId, useState } from 'react';
import { formatCount, type UsageView } from '@/domain/observe';
import { Panel } from '@/ui/components/ui/panel';
import { useRovingSelection } from '../tests/roving';
import './chart.css';

/**
 * Invocations per hour (today) or per day (7 / 30 days): one selectable bar per slot, a y axis with
 * 0 / half / max grid lines, dashed slots for the hours still to come. Local `us-chart-*` classes until
 * the registry `bar-chart` item lands (same pattern as the Tests duration chart).
 */
export function HourlyChart({ view }: { view: UsageView }) {
  const { chart } = view;
  const titleId = useId();
  const [sel, setSel] = useState(chart.defaultSelected);
  const lastReal = chart.defaultSelected;
  const roving = useRovingSelection(setSel, (i, key) =>
    key === 'ArrowRight' ? Math.min(i + 1, lastReal) : key === 'ArrowLeft' ? Math.max(i - 1, 0) : key === 'Home' ? 0 : key === 'End' ? lastReal : undefined,
  );
  const point = chart.points[sel];
  const inProgress = view.period === 'today' && sel === lastReal;
  const grid = [0, 0.5, 1].map((f) => ({ f, label: formatCount(Math.round(chart.max * f)) }));
  const compact = chart.points.length > 24;
  return (
    <Panel className="us-chart-card" padding="lg" aria-labelledby={titleId}>
      <div className="us-chart-head">
        <div className="us-chart-title">
          <h2 id={titleId}>{chart.title}</h2>
          <span>{chart.subtitle}</span>
        </div>
        <span className="us-chart-selection" aria-live="polite">
          {point ? (
            <>
              <span className="us-chart-selection-label">
                {point.name}
                {inProgress ? ' (in progress)' : ''}
              </span>{' '}
              <span className="us-chart-selection-value">{formatCount(point.value)} invocations</span>
            </>
          ) : null}
        </span>
      </div>
      <div className="us-chart-plot">
        {grid.map((g) => (
          <span key={g.f} aria-hidden="true">
            <span className="us-chart-grid" data-base={g.f === 0 ? '' : undefined} style={{ bottom: `${g.f * 100}%` }} />
            <span className="us-chart-tick" style={{ bottom: `${g.f * 100}%` }}>
              {g.label}
            </span>
          </span>
        ))}
        <div
          className="us-chart-bars"
          data-compact={compact ? '' : undefined}
          role="group"
          aria-label={`${chart.summary} One bar per ${chart.unit}, use the arrow keys to move between bars.`}
        >
          {chart.points.map((p, i) =>
            p.future ? (
              <span key={i} className="us-chart-bar" data-future="" aria-hidden="true">
                <span />
              </span>
            ) : (
              <button
                key={i}
                ref={roving.register(i)}
                type="button"
                className="us-chart-bar"
                aria-pressed={i === sel}
                tabIndex={i === sel ? 0 : -1}
                aria-label={`${p.name}: ${formatCount(p.value)} invocations`}
                onClick={() => setSel(i)}
                onKeyDown={roving.onKeyDown(i)}
              >
                <span style={{ height: `${Math.max(1, chart.max === 0 ? 0 : (p.value / chart.max) * 100)}%` }} />
              </button>
            ),
          )}
        </div>
      </div>
      <div className="us-chart-labels" data-compact={compact ? '' : undefined} aria-hidden="true">
        {chart.points.map((p, i) => (
          <span key={i}>{p.tick}</span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{chart.title}</caption>
        <thead>
          <tr>
            <th scope="col">{chart.unit === 'hour' ? 'Hour' : 'Day'}</th>
            <th scope="col">Invocations</th>
          </tr>
        </thead>
        <tbody>
          {chart.points.map((p, i) => (
            <tr key={i}>
              <th scope="row">{p.name}</th>
              <td>{p.future ? 'not yet' : formatCount(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
