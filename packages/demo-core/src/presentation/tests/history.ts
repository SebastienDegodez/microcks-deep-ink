import type { ServiceSummary } from '../../domain/shared/index.js';
import type { OperationOutcome, TestResult, TestRunSummary } from '../../domain/testing/index.js';
import { OP_WORD, type TimelineOperation } from './timeline.js';

/** Runs the table lists until the older ones are shown. */
export const HISTORY_LIMIT = 12;

/** Status of the "last test" badge: every value is a `ProofStatus` of deep-ink. */
export const LAST_TEST_TONE: Record<TestResult, 'success' | 'danger' | 'warning' | 'info'> = { passed: 'success', failed: 'danger', timeout: 'warning', running: 'info' };

/** The run started last, if any. */
export const latestRun = (runs: TestRunSummary[]) => runs.reduce<TestRunSummary | undefined>((a, r) => (!a || r.startedAt > a.startedAt ? r : a), undefined);

/** Share of passed runs in %, or `null` without runs. */
export const passRateOf = (recent: TestRunSummary[]): number | null =>
  recent.length ? Math.round((recent.filter((r) => r.result === 'passed').length / recent.length) * 100) : null;

/** Description of the page header: what each run replays and checks. */
export function historyDescription(service: Pick<ServiceSummary, 'exampleCount' | 'format'>): string {
  const examples = service.exampleCount;
  return `Conformance tests run against the implementations of this contract, on every endpoint. Each run replays the ${examples ?? ''}${examples ? ' ' : ''}contract examples and checks responses against the ${service.format.split(' ')[0]} schemas.`;
}

/** Accessible name of the service badge of the header, a link to the service. */
export const serviceLinkLabel = (service: Pick<ServiceSummary, 'protocol' | 'name' | 'version'>) => `${service.protocol} ${service.name} ${service.version}, open the service`;

/** Runners of the runs, in order of first use. */
export const historyRunners = (runs: TestRunSummary[]) => [...new Set(runs.map((r) => r.runner))];

/** Environments of the runs, each with the endpoint of its first run: `[environment, endpoint][]`. */
export function historyEnvironments(runs: TestRunSummary[]): [string, string][] {
  const seen = new Map<string, string>();
  for (const r of runs) if (!seen.has(r.environment)) seen.set(r.environment, r.endpoint);
  return [...seen];
}

/** Endpoint without its scheme: `pastry.staging.acme.io/v2`. */
export const endpointHost = (url: string) => url.replace(/^https?:\/\//, '');

/** Options of the result filter with their counts; failed includes timeouts. */
export function resultOptions(runs: TestRunSummary[]): { id: string; label: string; count: number }[] {
  const passedCount = runs.filter((r) => r.result === 'passed').length;
  return [
    { id: 'all', label: 'All', count: runs.length },
    { id: 'passed', label: 'Passed', count: passedCount },
    { id: 'failed', label: 'Failed', count: runs.length - passedCount },
  ];
}

/** Runs the table lists: all of them when expanded, else the first `HISTORY_LIMIT`. */
export const visibleRuns = (filtered: TestRunSummary[], expanded: boolean) => (expanded ? filtered : filtered.slice(0, HISTORY_LIMIT));

/** Run selected when the history opens: #117 when present, else the first run. */
export const initialRunId = (runs: TestRunSummary[]) => (runs.find((r) => r.id === '117') ? '117' : runs[0]?.id);

/** Lowest run number of the history, `Infinity` without runs. */
export const oldestRunNumber = (runs: TestRunSummary[]) => runs.reduce((min, r) => Math.min(min, Number(r.id)), Number.POSITIVE_INFINITY);

/** Link to the "Run a test" form, prefilled with the configuration of a run. */
export const relaunchHref = (run: Pick<TestRunSummary, 'serviceId' | 'id'>) => `/tests/create?service=${run.serviceId}&from=${run.id}`;

/** Outcome of each operation over a run, `none` without a result. */
export const bandOutcomes = (operations: TimelineOperation[], run: TestRunSummary): OperationOutcome[] => operations.map((_, i) => run.operations?.[i] ?? 'none');

/** Accessible name of the operations band of a run. */
export const bandLabel = (operations: TimelineOperation[], outcomes: OperationOutcome[]) =>
  operations.map((op, i) => `${op.verb} ${op.path} ${OP_WORD[outcomes[i] ?? 'none']}`).join(', ');

/** Tooltip of one segment of the operations band. */
export const bandTitle = (op: TimelineOperation | undefined, outcome: OperationOutcome) => `${op?.verb} ${op?.path}: ${OP_WORD[outcome]}`;

/** Label of the button that shows or hides the older runs. */
export const moreRunsLabel = (showAll: boolean, filteredCount: number) => (showAll ? `Show the ${HISTORY_LIMIT} latest only` : `Show ${filteredCount - HISTORY_LIMIT} older runs`);
