import { Link as RouterLink } from 'react-router';
import { runConformance, type TestRunSummary } from '@/domain/testing';
import { BarChart, type BarTone, Icon, MethodTag } from '@microcks/deep-ink';
import { TEST_RESULT_ICON, TEST_RESULT_WORD, type TestResult } from '@/ui/app/outcomes';
import { testRunHref } from '@/ui/app/format';

/** Bars taller than this duration are capped at 88% and labelled with their duration. */
const CAP_MS = 3000;
const WINDOW = 20;

const TONE: Record<TestResult, BarTone> = { passed: 'success', failed: 'danger', timeout: 'warning', running: 'running' };
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
  const selected = runs.find((r) => r.id === selectedId) ?? chrono[n - 1];
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
    `Run #${r.id}, ${TEST_RESULT_WORD[r.result].toLowerCase()}, ${fmtDuration(r.durationMs)}, ${samples(r)} samples passed, ${shortDate(r.startedAt)}${filtered && !matches(r) ? ', outside the filters' : ''}`;

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

      <BarChart
        label="Runs, oldest to newest. Use the arrow keys to move between bars."
        max={CAP_MS}
        minHeight={4}
        selectedId={selected?.id}
        onSelect={onSelect}
        ticks={['3 s', '1.5 s', '0']}
        ticksEnd={['100%', '75%', '50%']}
        bars={chrono.map((r, i) => {
          const capped = r.durationMs > CAP_MS;
          return {
            id: r.id,
            value: capped ? 0.88 * CAP_MS : r.durationMs,
            cap: capped ? `${Math.round(r.durationMs / 1000)} s` : undefined,
            description: aria(r),
            label: i === 0 || i === n - 1 || Number(r.id) % 5 === 0 || r.id === selected?.id ? r.id : '',
            tone: TONE[r.result],
            faded: filtered && !matches(r),
          };
        })}
        overlay={
          <svg viewBox="0 0 200 100" preserveAspectRatio="none">
            <polyline points={line} vectorEffect="non-scaling-stroke" />
          </svg>
        }
        table={{
          caption: `Conformance timeline, last ${n} runs, oldest first`,
          columns: ['Run', 'Date', 'Result', 'Duration', 'Samples passed', 'Conformance', ...operations.map((op) => `${op.verb} ${op.path}`)],
          rows: chrono.map((r) => [
            `#${r.id}`,
            shortDate(r.startedAt),
            TEST_RESULT_WORD[r.result],
            fmtDuration(r.durationMs),
            samples(r),
            `${pct(r)}%`,
            ...operations.map((_, i) => OP_WORD[r.operations?.[i] ?? 'none']),
          ]),
        }}
      />

      {selected ? (
        <div className="test-timeline-strip" aria-live="polite" data-tone={selected.result}>
          <span className="test-timeline-id">#{selected.id}</span>
          <span className="test-timeline-result">
            <Icon name={TEST_RESULT_ICON[selected.result]} size={14} strokeWidth={selected.result === 'timeout' ? 2.2 : 2.6} />
            {TEST_RESULT_WORD[selected.result]}
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
