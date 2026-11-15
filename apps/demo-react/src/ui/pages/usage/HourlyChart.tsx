import { useId, useState } from 'react';
import { formatCount, type UsageView } from '@/domain/observe';
import { BarChart, Panel } from '@microcks/deep-ink';
import { chartBars, chartLabel, chartTable, chartTicks } from './figures';
import '@microcks/demo-styles/pages/usage/chart.css';

/**
 * Invocations per hour (today) or per day (7 / 30 days) on the registry bar chart: one selectable bar per slot,
 * a 0 / half / max axis, dashed slots for the hours still to come, and the selection in the card header.
 */
export function HourlyChart({ view }: { view: UsageView }) {
  const { chart } = view;
  const titleId = useId();
  const [sel, setSel] = useState(chart.defaultSelected);
  const point = chart.points[sel];
  const inProgress = view.period === 'today' && sel === chart.defaultSelected;
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
      <BarChart
        label={chartLabel(chart)}
        bars={chartBars(chart)}
        max={chart.max}
        selectedId={String(sel)}
        onSelect={(id) => setSel(Number(id))}
        selection="fill"
        height={200}
        gap={compact ? 3 : 6}
        minHeight={1}
        ticks={chartTicks(chart)}
        grid={[0, 0.5]}
        table={chartTable(chart)}
      />
    </Panel>
  );
}
