import { Link as RouterLink } from 'react-router';
import { runConformance, type TestRunSummary } from '@/domain/testing';
import { Icon, type IconName } from '@/ui/components/ui/icon';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { testRunHref } from '../explore-kit/format';
import { useRovingSelection } from './roving';

/** Bars taller than this duration are capped at 88% and labelled with their duration. */
const CAP_MS = 3000;
const WINDOW = 20;

type Result = TestRunSummary['result'];
const WORD: Record<Result, string> = { passed: 'Passed', failed: 'Failed', timeout: 'Timed out', running: 'Running' };
const ICON: Record<Result, IconName> = { passed: 'check', failed: 'cross', timeout: 'clock', running: 'running' };
const OP_WORD = { pass: 'passed', fail: 'failed', none: 'no result' } as const;

const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const TIME = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
const day = (iso: string) => DATE.format(new Date(iso));
/** `Nov 2, 09:22` (UTC, like the demo clock). */
export const shortDate = (iso: string) => `${day(iso)}, ${TIME.format(new Date(iso))}`;
/** `960 ms`, `1.84 s`. */
export const fmtDuration = (ms: number) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`);
const samples = (r: TestRunSummary) => `${r.passed}/${r.total}`;

/** The last 20 runs, oldest first, as the timeline shows them. */
export function timelineRuns(runs: TestRunSummary[]): TestRunSummary[] {
  return runs
    .slice()
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .slice(-WINDOW);
}

export interface TestTimelineProps {
  /** Runs of the service, any order. */
  runs: TestRunSummary[];
  /** Operations of the service, in the order of `run.operations`. */
  operations: { id: string; verb: string; path: string }[];
  selectedId?: string;
  onSelect: (id: string) => void;
  /** False for a run hidden by the filters of the table: its bar fades. */
  matches: (run: TestRunSummary) => boolean;
  filtered: boolean;
  relative: (iso: string) => string;
}

/** Conformance timeline: one bar per run (height = duration, colour = result), the samples-passed line, the selected run and per-operation cards. */
export function TestTimeline({ runs, operations, selectedId, onSelect, matches, filtered, relative }: TestTimelineProps) {
  const chrono = timelineRuns(runs);
  const n = chrono.length;
  const selIndex = Math.max(0, chrono.findIndex((r) => r.id === selectedId));
  const selected = runs.find((r) => r.id === selectedId) ?? chrono[n - 1];
  const roving = useRovingSelection(
    (i) => {
      const run = chrono[i];
      if (run) onSelect(run.id);
    },
    (i, key) =>
      key === 'ArrowRight' ? Math.min(i + 1, n - 1) : key === 'ArrowLeft' ? Math.max(i - 1, 0) : key === 'Home' ? 0 : key === 'End' ? n - 1 : undefined,
  );
  if (n === 0) return null;

  const first = chrono[0];
  const last = chrono[n - 1];
  const year = last ? new Date(last.startedAt).getUTCFullYear() : '';
  const subtitle = `Last ${n} runs · ${first ? day(first.startedAt) : ''} → ${last ? day(last.startedAt) : ''}, ${year} · click a bar to inspect`;
  /** The line plots the run's conformance score (stored, or samples passed over samples). */
  const pct = (r: TestRunSummary) => runConformance(r);
  const line = chrono
    .map((r, i) => `${((i + 0.5) * (200 / n)).toFixed(1)},${Math.min(100, Math.max(0, ((100 - pct(r)) / 50) * 100)).toFixed(1)}`)
    .join(' ');
  const aria = (r: TestRunSummary) =>
    `Run #${r.id}, ${WORD[r.result].toLowerCase()}, ${fmtDuration(r.durationMs)}, ${samples(r)} samples passed, ${shortDate(r.startedAt)}${filtered && !matches(r) ? ', outside the filters' : ''}`;

  const opStats = operations.map((op, i) => {
    const outcome = (r: TestRunSummary) => r.operations?.[i] ?? 'none';
    const passed = chrono.filter((r) => outcome(r) === 'pass').length;
    const failed = chrono.filter((r) => outcome(r) === 'fail').length;
    const none = n - passed - failed;
    const rate = Math.round((passed / n) * 100);
    const lastFail = [...chrono].reverse().find((r) => outcome(r) === 'fail');
    return {
      op,
      rate,
      tone: rate >= 80 ? 'success' : rate >= 50 ? 'warning' : 'danger',
      cells: chrono.map((r) => ({ id: r.id, outcome: outcome(r) })),
      aria: `${op.verb} ${op.path}: ${passed} passed, ${failed} failed, ${none} without result over ${n} runs`,
      note: `${passed} passed · ${failed} failed${none ? ` · ${none} no result` : ''}${lastFail ? ` · last failure #${lastFail.id}` : ''}`,
    };
  });

  return (
    <section className="test-timeline" aria-labelledby="test-timeline-title">
      <div className="test-timeline-head">
        <div className="test-timeline-heading">
          <h2 id="test-timeline-title">Conformance timeline</h2>
          <span className="test-timeline-sub">{subtitle}</span>
        </div>
        <div className="test-timeline-legend" aria-hidden="true">
          <span><i data-tone="passed" />Passed</span>
          <span><i data-tone="failed" />Failed</span>
          <span><i data-tone="timeout" />Timed out</span>
          <span><i data-tone="line" />Conformance, %</span>
          <span className="test-timeline-muted">Bar height = duration</span>
        </div>
      </div>

      <div className="bar-chart">
        <div className="bar-chart-axis" aria-hidden="true">
          <span>3 s</span><span>1.5 s</span><span>0</span>
        </div>
        <div className="bar-chart-main">
          <div className="bar-chart-plot">
            <div className="bar-chart-grid" aria-hidden="true" style={{ top: 0 }} />
            <div className="bar-chart-grid" aria-hidden="true" style={{ top: '50%' }} />
            <div className="bar-chart-bars" role="group" aria-label="Runs, oldest to newest. Use the arrow keys to move between bars." style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
              {chrono.map((r, i) => {
                const capped = r.durationMs > CAP_MS;
                const height = capped ? 88 : Math.max(4, Math.round((r.durationMs / CAP_MS) * 100));
                const pressed = i === selIndex;
                return (
                  <div key={r.id} className="bar-chart-cell" data-faded={filtered && !matches(r) ? '' : undefined}>
                    {capped ? (
                      <span className="bar-chart-cap" aria-hidden="true" style={{ bottom: `calc(${height}% + 2px)` }}>
                        {Math.round(r.durationMs / 1000)} s
                      </span>
                    ) : null}
                    <button
                      ref={roving.register(i)}
                      type="button"
                      className="bar-chart-bar"
                      aria-pressed={pressed}
                      aria-label={aria(r)}
                      title={aria(r)}
                      tabIndex={pressed ? 0 : -1}
                      onClick={() => onSelect(r.id)}
                      onKeyDown={roving.onKeyDown(i)}
                    >
                      <span data-tone={r.result} style={{ height: `${height}%` }} />
                    </button>
                  </div>
                );
              })}
            </div>
            <svg className="bar-chart-line" aria-hidden="true" viewBox="0 0 200 100" preserveAspectRatio="none">
              <polyline points={line} vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div className="bar-chart-labels" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {chrono.map((r, i) => {
              const show = i === 0 || i === n - 1 || Number(r.id) % 5 === 0 || i === selIndex;
              return (
                <span key={r.id} data-selected={i === selIndex ? '' : undefined}>
                  {show ? r.id : ''}
                </span>
              );
            })}
          </div>
        </div>
        <div className="bar-chart-axis" data-side="end" aria-hidden="true">
          <span>100%</span><span>75%</span><span>50%</span>
        </div>
      </div>

      <table className="sr-only">
        <caption>Conformance timeline, last {n} runs, oldest first</caption>
        <thead>
          <tr>
            <th scope="col">Run</th>
            <th scope="col">Date</th>
            <th scope="col">Result</th>
            <th scope="col">Duration</th>
            <th scope="col">Samples passed</th>
            <th scope="col">Conformance</th>
            {operations.map((op) => <th scope="col" key={op.id}>{op.verb} {op.path}</th>)}
          </tr>
        </thead>
        <tbody>
          {chrono.map((r) => (
            <tr key={r.id}>
              <th scope="row">#{r.id}</th>
              <td>{shortDate(r.startedAt)}</td>
              <td>{WORD[r.result]}</td>
              <td>{fmtDuration(r.durationMs)}</td>
              <td>{samples(r)}</td>
              <td>{pct(r)}%</td>
              {operations.map((op, i) => <td key={op.id}>{OP_WORD[r.operations?.[i] ?? 'none']}</td>)}
            </tr>
          ))}
        </tbody>
      </table>

      {selected ? (
        <div className="test-timeline-strip" aria-live="polite" data-tone={selected.result}>
          <span className="test-timeline-id">#{selected.id}</span>
          <span className="test-timeline-result">
            <Icon name={ICON[selected.result]} size={14} strokeWidth={selected.result === 'timeout' ? 2.2 : 2.6} />
            {WORD[selected.result]}
          </span>
          <span className="test-timeline-when">
            {relative(selected.startedAt)} · {shortDate(selected.startedAt)}, {new Date(selected.startedAt).getUTCFullYear()}
          </span>
          <span className="test-timeline-endpoint">{selected.endpoint}</span>
          <span className="test-timeline-meta">
            {selected.runner} · {fmtDuration(selected.durationMs)} · {samples(selected)}
          </span>
          {selected.reason ? <span className="test-timeline-reason">{selected.reason}</span> : null}
          <RouterLink className="test-timeline-open" to={testRunHref(selected)} aria-label={`Open run #${selected.id}`}>
            Open run
            <Icon name="chevron" size={13} />
          </RouterLink>
        </div>
      ) : null}

      {opStats.length > 0 ? (
        <ul className="test-op-cards">
          {opStats.map((s) => (
            <li key={s.op.id} className="test-op-card">
              <div className="test-op-card-head">
                <MethodTag method={s.op.verb} />
                <span className="test-op-card-path" title={s.op.path}>{s.op.path}</span>
                <span className="test-op-card-rate" data-tone={s.tone}>{s.rate}%</span>
              </div>
              <div className="test-op-card-strip" role="img" aria-label={s.aria} style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
                {s.cells.map((c) => <span key={c.id} data-outcome={c.outcome} />)}
              </div>
              <span className="test-op-card-note">{s.note}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
