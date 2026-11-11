import { Link as RouterLink } from 'react-router';
import type { TestRunSummary } from '@/domain/testing';
import { BarChart, Icon, MethodTag } from '@microcks/deep-ink';
import { TEST_RESULT_ICON, TEST_RESULT_WORD } from '@/ui/app/outcomes';
import { testRunHref } from '@/ui/app/format';
import {
  CAP_MS,
  conformanceLine,
  fmtDuration,
  operationStats,
  runSamples,
  shortDate,
  timelineBars,
  timelineRuns,
  timelineSelection,
  timelineSubtitle,
  timelineTable,
} from './timeline';

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
  const selected = timelineSelection(runs, chrono, selectedId);
  if (n === 0) return null;

  const subtitle = timelineSubtitle(chrono);
  const line = conformanceLine(chrono);
  const opStats = operationStats(operations, chrono);

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
        bars={timelineBars(chrono, selected?.id, (r) => filtered && !matches(r))}
        overlay={
          <svg viewBox="0 0 200 100" preserveAspectRatio="none">
            <polyline points={line} vectorEffect="non-scaling-stroke" />
          </svg>
        }
        table={timelineTable(chrono, operations)}
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
            {selected.runner} · {fmtDuration(selected.durationMs)} · {runSamples(selected)}
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
                <MethodTag method={s.op.verb} className="test-op-method" />
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
