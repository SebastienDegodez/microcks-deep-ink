import { runConformance, type OperationOutcome, type TestResult, type TestRunSummary } from '../../domain/testing/index.js';
import { TEST_RESULT_WORD } from '../shared/outcomes.js';

/** Bars taller than this duration are capped at 88% and labelled with their duration. */
export const CAP_MS = 3000;
const WINDOW = 20;

/** Tone of a run's bar: every value is a `BarTone` of deep-ink. */
export const TIMELINE_TONE: Record<TestResult, 'success' | 'danger' | 'warning' | 'running'> = { passed: 'success', failed: 'danger', timeout: 'warning', running: 'running' };

/** Word of an operation outcome, in the hidden table, the operations band and its tooltips. */
export const OP_WORD = { pass: 'passed', fail: 'failed', none: 'no result' } as const;

/** Tone of a rate in %: success from 80, warning from 50, else danger. */
export const rateTone = (pct: number): 'success' | 'warning' | 'danger' => (pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'danger');

const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const TIME = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
const day = (iso: string) => DATE.format(new Date(iso));
/** `Nov 2, 09:22` (UTC, like the demo clock). */
export const shortDate = (iso: string) => `${day(iso)}, ${TIME.format(new Date(iso))}`;
/** `960 ms`, `1.84 s`. */
export const fmtDuration = (ms: number) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`);
/** Samples passed over samples of a run: `6/7`. */
export const runSamples = (r: TestRunSummary) => `${r.passed}/${r.total}`;

/** The last 20 runs, oldest first, as the timeline shows them. */
export function timelineRuns(runs: TestRunSummary[]): TestRunSummary[] {
  return runs
    .slice()
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .slice(-WINDOW);
}

/** An operation of the service, in the order of `run.operations`. */
export interface TimelineOperation { id: string; verb: string; path: string }

/** The selected run, else the newest run of the timeline. */
export const timelineSelection = (runs: TestRunSummary[], chrono: TestRunSummary[], selectedId: string | undefined): TestRunSummary | undefined =>
  runs.find((r) => r.id === selectedId) ?? chrono[chrono.length - 1];

/** Subtitle of the timeline: how many runs, from which day to which day. */
export function timelineSubtitle(chrono: TestRunSummary[]): string {
  const n = chrono.length;
  const first = chrono[0];
  const last = chrono[n - 1];
  const year = last ? new Date(last.startedAt).getUTCFullYear() : '';
  return `Last ${n} runs · ${first ? day(first.startedAt) : ''} → ${last ? day(last.startedAt) : ''}, ${year} · click a bar to inspect`;
}

/** Points of the conformance line drawn over the bars, in a 200 × 100 view box. */
export function conformanceLine(chrono: TestRunSummary[]): string {
  const n = chrono.length;
  /** The line plots the run's conformance score (stored, or samples passed over samples). */
  const pct = (r: TestRunSummary) => runConformance(r);
  return chrono
    .map((r, i) => `${((i + 0.5) * (200 / n)).toFixed(1)},${Math.min(100, Math.max(0, ((100 - pct(r)) / 50) * 100)).toFixed(1)}`)
    .join(' ');
}

/** Accessible name of a run's bar; `outside` when the filters of the table hide the run. */
export const timelineRunAria = (r: TestRunSummary, outside: boolean) =>
  `Run #${r.id}, ${TEST_RESULT_WORD[r.result].toLowerCase()}, ${fmtDuration(r.durationMs)}, ${runSamples(r)} samples passed, ${shortDate(r.startedAt)}${outside ? ', outside the filters' : ''}`;

/** One bar of the timeline: a `BarChartBar` of deep-ink. */
export interface TimelineBar {
  id: string;
  value: number;
  cap?: string;
  description: string;
  label: string;
  tone: 'success' | 'danger' | 'warning' | 'running';
  faded: boolean;
}

/** One bar per run: height = duration (capped), colour = result, faded when `outside` the filters. */
export function timelineBars(chrono: TestRunSummary[], selectedRunId: string | undefined, outside: (r: TestRunSummary) => boolean): TimelineBar[] {
  const n = chrono.length;
  return chrono.map((r, i) => {
    const capped = r.durationMs > CAP_MS;
    return {
      id: r.id,
      value: capped ? 0.88 * CAP_MS : r.durationMs,
      cap: capped ? `${Math.round(r.durationMs / 1000)} s` : undefined,
      description: timelineRunAria(r, outside(r)),
      label: i === 0 || i === n - 1 || Number(r.id) % 5 === 0 || r.id === selectedRunId ? r.id : '',
      tone: TIMELINE_TONE[r.result],
      faded: outside(r),
    };
  });
}

/** Text equivalent of the timeline: one row per run, one column per operation. */
export function timelineTable(chrono: TestRunSummary[], operations: TimelineOperation[]): { caption: string; columns: string[]; rows: string[][] } {
  return {
    caption: `Conformance timeline, last ${chrono.length} runs, oldest first`,
    columns: ['Run', 'Date', 'Result', 'Duration', 'Samples passed', 'Conformance', ...operations.map((op) => `${op.verb} ${op.path}`)],
    rows: chrono.map((r) => [
      `#${r.id}`,
      shortDate(r.startedAt),
      TEST_RESULT_WORD[r.result],
      fmtDuration(r.durationMs),
      runSamples(r),
      `${runConformance(r)}%`,
      ...operations.map((_, i) => OP_WORD[r.operations?.[i] ?? 'none']),
    ]),
  };
}

/** Card of one operation over the timeline: pass rate, one cell per run, accessible summary and note. */
export interface OperationStats {
  op: TimelineOperation;
  rate: number;
  tone: 'success' | 'warning' | 'danger';
  cells: { id: string; outcome: OperationOutcome }[];
  aria: string;
  note: string;
}

/** Pass rate and outcomes of each operation over the runs of the timeline. */
export function operationStats(operations: TimelineOperation[], chrono: TestRunSummary[]): OperationStats[] {
  const n = chrono.length;
  return operations.map((op, i) => {
    const outcome = (r: TestRunSummary) => r.operations?.[i] ?? 'none';
    const passed = chrono.filter((r) => outcome(r) === 'pass').length;
    const failed = chrono.filter((r) => outcome(r) === 'fail').length;
    const none = n - passed - failed;
    const rate = Math.round((passed / n) * 100);
    const lastFail = [...chrono].reverse().find((r) => outcome(r) === 'fail');
    return {
      op,
      rate,
      tone: rateTone(rate),
      cells: chrono.map((r) => ({ id: r.id, outcome: outcome(r) })),
      aria: `${op.verb} ${op.path}: ${passed} passed, ${failed} failed, ${none} without result over ${n} runs`,
      note: `${passed} passed · ${failed} failed${none ? ` · ${none} no result` : ''}${lastFail ? ` · last failure #${lastFail.id}` : ''}`,
    };
  });
}
