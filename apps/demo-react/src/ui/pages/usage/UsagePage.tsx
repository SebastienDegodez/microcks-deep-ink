import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  USAGE_PERIODS,
  WEEKDAY_HEADERS,
  formatCount,
  formatTrend,
  heatmapWeeks,
  type UsagePeriod,
  type UsageView,
} from '@/domain/observe';
import { PageHeader, usePageTitle, useQuery, useUseCases } from '@/ui/app';
import { Disclosure } from '@/ui/components/ui/disclosure';
import { Field } from '@/ui/components/ui/field';
import { Panel } from '@/ui/components/ui/panel';
import { Segmented } from '@/ui/components/ui/segmented';
import { Select } from '@/ui/components/ui/select';
import { ErrorBlock, LoadingBlock } from '../tests/PageStates';
import { useRovingSelection } from '../tests/roving';
import { ConformanceSection } from './ConformanceSection';
import './usage.css';

export default function UsagePage() {
  const { serviceId } = useParams();
  const scope = serviceId ?? 'all';
  usePageTitle('Usage & conformance · Microcks');
  const uc = useUseCases();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<UsagePeriod>('today');
  const services = useQuery(() => uc.catalog.listServices(), []);
  const usage = useQuery(() => uc.observe.usage(scope, period), [scope, period]);
  const domains = useQuery(() => uc.observe.conformanceByDomain(), []);
  const view = usage.data;

  return (
    <>
      <PageHeader title="Usage & conformance" />
      <div className="stack">
        <div className="demo-actions-row" role="group" aria-label="View options">
          <Field label="Service">
            {(c) => (
              <Select {...c} value={scope} onChange={(e) => navigate(e.target.value === 'all' ? '/metrics' : `/metrics/${e.target.value}`)}>
                <option value="all">All services</option>
                {(services.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.version}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Segmented label="Period" options={USAGE_PERIODS} value={period} onChange={(id) => setPeriod(id as UsagePeriod)} />
        </div>
        {usage.status === 'loading' && !view ? <LoadingBlock label="usage" /> : null}
        {usage.status === 'error' ? <ErrorBlock error={usage.error} what="Usage" onRetry={usage.reload} /> : null}
        {view ? (
          <div className="stack" aria-busy={usage.status === 'loading'}>
            <Kpis view={view} />
            <Bars key={`${view.scope}-${view.period}`} view={view} />
            <Heatmap key={`h-${view.scope}`} view={view} />
            <Table view={view} />
          </div>
        ) : null}
        {domains.data ? <ConformanceSection domains={domains.data} view={view} selected={scope} /> : null}
      </div>
    </>
  );
}

function Kpis({ view }: { view: UsageView }) {
  return (
    <Panel title={`${view.label} · ${view.periodLabel}`}>
      <p className="demo-muted">{view.scopeLine}</p>
      <ul className="us-kpis">
        <li>
          <div className="us-kpi-value">{formatCount(view.kpis.total)}</div>
          <div>Invocations, {formatTrend(view.kpis.growth)} vs previous period</div>
        </li>
        <li>
          <div className="us-kpi-value">{formatCount(view.kpis.peak)}</div>
          <div>{view.kpis.peakTitle}: {view.kpis.peakWhen}</div>
        </li>
        <li>
          <div className="us-kpi-value demo-mono" style={{ fontSize: '0.9375rem' }}>{view.kpis.lastCall}</div>
          <div>Last call</div>
        </li>
      </ul>
    </Panel>
  );
}

function Bars({ view }: { view: UsageView }) {
  const { chart } = view;
  const [sel, setSel] = useState(chart.defaultSelected);
  const last = chart.points.length - 1;
  const roving = useRovingSelection(setSel, (i, key) =>
    key === 'ArrowRight' ? Math.min(i + 1, last) : key === 'ArrowLeft' ? Math.max(i - 1, 0) : key === 'Home' ? 0 : key === 'End' ? last : undefined,
  );
  const point = chart.points[sel];
  return (
    <Panel title={chart.title}>
      <p className="demo-muted">{chart.subtitle}</p>
      <p>{chart.summary}</p>
      <div className="us-bars" role="group" aria-label={`${chart.title}, one bar per ${chart.unit}. Use the arrow keys to move between bars.`}>
        {chart.points.map((p, i) => (
          <button
            key={i}
            ref={roving.register(i)}
            type="button"
            className="us-bar"
            data-future={p.future ? '' : undefined}
            aria-pressed={i === sel}
            tabIndex={i === sel ? 0 : -1}
            aria-label={`${p.name}: ${p.future ? 'not yet' : `${formatCount(p.value)} invocations`}`}
            onClick={() => setSel(i)}
            onKeyDown={roving.onKeyDown(i)}
          >
            <span style={{ height: `${chart.max === 0 ? 0 : (p.value / chart.max) * 100}%` }} />
          </button>
        ))}
      </div>
      <div className="us-axis" aria-hidden="true">
        <span>{chart.points[0]?.tick}</span>
        <span>{chart.points[last]?.tick}</span>
      </div>
      <p role="status" style={{ margin: '8px 0' }}>
        {point ? `${point.name}: ${point.future ? 'not yet' : `${formatCount(point.value)} invocations`}` : ''}
      </p>
      <Disclosure summary="Show data table">
        <div className="demo-scroll">
          <table className="us-table">
            <caption className="sr-only">{chart.title}</caption>
            <thead><tr><th scope="col">{chart.unit === 'hour' ? 'Hour' : 'Day'}</th><th scope="col" data-num="">Invocations</th></tr></thead>
            <tbody>
              {chart.points.map((p, i) => (
                <tr key={i}><th scope="row">{p.name}</th><td data-num="">{p.future ? 'not yet' : formatCount(p.value)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Disclosure>
    </Panel>
  );
}

function Heatmap({ view }: { view: UsageView }) {
  const { heatmap } = view;
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
  return (
    <Panel title="Daily calendar">
      <p className="demo-muted">{heatmap.subtitle}</p>
      <p>
        {formatCount(heatmap.total)} invocations over the period, {formatCount(heatmap.weekdayAverage)} per weekday on average. Busiest day: {heatmap.busiest}.
      </p>
      <div className="us-heat" role="group" aria-label="Calendar heatmap, one button per day. Use the arrow keys to move between days.">
        {heatmap.cells.map((c) => (
          <button
            key={c.index}
            ref={roving.register(c.index)}
            type="button"
            className="us-day"
            data-level={c.level}
            style={{ gridColumn: c.week + 1, gridRow: c.weekday + 1 }}
            aria-pressed={c.index === sel}
            tabIndex={c.index === sel ? 0 : -1}
            aria-label={`${c.name}: ${formatCount(c.value)} invocations, level ${c.level} of 3`}
            onClick={() => setSel(c.index)}
            onKeyDown={roving.onKeyDown(c.index)}
          />
        ))}
      </div>
      <p role="status" style={{ margin: '8px 0' }}>
        {cell ? `${cell.name}: ${formatCount(cell.value)} invocations, level ${cell.level} of 3` : ''}
      </p>
      <Disclosure summary="Show data table">
        <div className="demo-scroll">
          <table className="us-table">
            <caption className="sr-only">Invocations per week and weekday</caption>
            <thead>
              <tr>
                <th scope="col">Week of</th>
                {WEEKDAY_HEADERS.map((d) => <th scope="col" data-num="" key={d}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.week}>
                  <th scope="row">{w.week}</th>
                  {w.values.map((v, i) => <td data-num="" key={i}>{v === null ? '–' : formatCount(v)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Disclosure>
    </Panel>
  );
}

function Table({ view }: { view: UsageView }) {
  const { table } = view;
  return (
    <Panel title={table.title}>
      <p className="demo-muted">{table.subtitle}</p>
      <div className="demo-scroll">
        <table className="us-table">
          <caption className="sr-only">{table.title}</caption>
          <thead>
            <tr>
              <th scope="col">{table.firstColumn}</th>
              <th scope="col">{table.secondColumn}</th>
              <th scope="col" data-num="">Calls</th>
              <th scope="col" data-num="">Share</th>
              <th scope="col" data-num="">Trend</th>
              <th scope="col">Last call</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r) => (
              <tr key={r.id}>
                <th scope="row">{r.method ? <span className="demo-mono">{r.method} </span> : null}{r.name}{r.live ? ' (live)' : ''}</th>
                <td>{r.detail}</td>
                <td data-num="">{formatCount(r.calls)}</td>
                <td data-num=""><span className="us-share" style={{ width: `${Math.max(r.width / 2, 2)}px` }} aria-hidden="true" />{r.share}%</td>
                <td data-num="">{formatTrend(r.trend)}</td>
                <td>{r.last}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><th scope="row" colSpan={2}>Total</th><td data-num="">{formatCount(table.total)}</td><td data-num="">100%</td><td data-num="">{formatTrend(table.trend)}</td><td /></tr>
          </tfoot>
        </table>
      </div>
      {table.note ? <p className="demo-muted">{table.note}</p> : null}
    </Panel>
  );
}
