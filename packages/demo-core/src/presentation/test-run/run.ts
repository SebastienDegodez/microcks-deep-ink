import { parseUrl } from '../../domain/shared/url.js';
import type { LogLine, TestResult, TestRun, TestStepResult } from '../../domain/testing/index.js';
import { TEST_RESULT_WORD, type BandOutcome } from '../shared/outcomes.js';

/** The run "executes" one step every 1.3 s, as in the prototype. */
export const STEP_MS = 1300;
/** A live run opens with 3 steps already finished (the prototype's baseline). */
export const LIVE_START = 3;

/** State of a step, or of an operation, while the run replays. */
export type StepState = 'pass' | 'fail' | 'run' | 'pend';

/** Word and badge status of a step state: every status is an `Outcome` of deep-ink. */
export const STEP_LOOK: Record<StepState, { word: string; status: 'conformant' | 'failed' | 'running' | 'never' }> = {
  pass: { word: 'Passed', status: 'conformant' },
  fail: { word: 'Failed', status: 'failed' },
  run: { word: 'Running', status: 'running' },
  pend: { word: 'Queued', status: 'never' },
};

/** Progress-bar segment of a step state: every value is a `RunSegment` of deep-ink. */
export const STEP_SEGMENT: Record<StepState, 'done' | 'failed' | 'current' | 'queued'> = { pass: 'done', fail: 'failed', run: 'current', pend: 'queued' };

/** Host of an endpoint (`pastry.staging.acme.io`), or the text itself when it is not a URL. */
export function hostOf(url: string): string {
  try {
    return parseUrl(url).host;
  } catch {
    return url;
  }
}

/** Path of an endpoint without its trailing slash (`/v2`): `''` for a root path or a text that is not a URL. */
export function basePath(url: string): string {
  try {
    const p = parseUrl(url).pathname;
    return p === '/' ? '' : p.replace(/\/$/, '');
  } catch {
    return '';
  }
}

/** Where the replay of a run starts: a live run with its first steps finished, any other run done. */
export const initialReplay = (run: Pick<TestRun, 'live' | 'steps'>): { phase: 'running' | 'done'; tick: number } =>
  run.live ? { phase: 'running', tick: Math.min(LIVE_START, run.steps.length) } : { phase: 'done', tick: run.steps.length };

/** State of each step: the `finished` first ones passed or failed, the one at `tick` running while the run plays, the others queued. */
export const stepStates = (run: Pick<TestRun, 'steps'>, finished: number, tick: number, running: boolean): StepState[] =>
  run.steps.map((s, i) => (i < finished ? (s.result === 'passed' ? 'pass' : 'fail') : i === tick && running ? 'run' : 'pend'));

/** Passed, failed and queued (running or not started) steps. */
export function stepCounts(states: StepState[]): { pass: number; fail: number; queued: number } {
  const pass = states.filter((s) => s === 'pass').length;
  const fail = states.filter((s) => s === 'fail').length;
  return { pass, fail, queued: states.length - pass - fail };
}

/** One operation of a run, with the indexes of its steps. */
export interface RunOperation {
  id: string;
  method: string;
  path: string;
  idx: number[];
}

/** Operations of a run: its operation labels, else the operations of its steps in order of first use. */
export function runOperations(run: Pick<TestRun, 'operationLabels' | 'steps'>): RunOperation[] {
  const labels = run.operationLabels ?? [];
  const ids = labels.length > 0 ? labels.map((l) => l.id) : [...new Set(run.steps.map((s) => s.operationId))];
  return ids.map((id) => {
    const label = labels.find((l) => l.id === id);
    const first = run.steps.find((s) => s.operationId === id);
    const idx = run.steps.flatMap((s, i) => (s.operationId === id ? [i] : []));
    return { id, method: label?.method ?? first?.method ?? 'GET', path: label?.path ?? first?.path ?? id, idx };
  });
}

/** State of each operation: done once all its steps are (failed if one failed), running once one started, else queued. */
export const operationStates = (operations: RunOperation[], states: StepState[]): StepState[] =>
  operations.map((op) => {
    const st = op.idx.map((i) => states[i]);
    const fin = st.filter((s) => s === 'pass' || s === 'fail').length;
    if (fin === st.length) return st.includes('fail') ? 'fail' : 'pass';
    return st.includes('run') || fin > 0 ? 'run' : 'pend';
  });

/** First failed step of a run, if any. */
export const firstFailedStep = (run: Pick<TestRun, 'steps'>) => run.steps.find((s) => s.result === 'failed');

/** Step whose diff is open: `sel` (`''` = none), or with `null` the latest finished step while the run plays, then the first failed (else the last) step. */
export function selectedStepId(run: Pick<TestRun, 'steps'>, done: boolean, tick: number, sel: string | null): string | undefined {
  const autoSel = done ? (firstFailedStep(run) ?? run.steps[run.steps.length - 1])?.id : run.steps[tick - 1]?.id;
  return sel === null ? autoSel : sel;
}

/** Conformance score in %: passed steps over all steps. */
export const runScore = (passCount: number, total: number) => Math.round((100 * passCount) / Math.max(1, total));

/** Level of a conformance score: `high` from 80 %, `mid` from 50 %, else `low`. */
export const scoreLevel = (score: number): 'high' | 'mid' | 'low' => (score >= 80 ? 'high' : score >= 50 ? 'mid' : 'low');

/** Timeline point of the run before `runId`: none when `runId` is first or not in the timeline. */
export function previousPoint<T extends { runId: string; conformance: number }>(points: T[], runId: string): T | undefined {
  const at = points.findIndex((p) => p.runId === runId);
  return at > 0 ? points[at - 1] : undefined;
}

/** Direction of the score trend, from the score delta with the previous run. */
export const trendDir = (delta: number): 'down' | 'up' | 'flat' => (delta < 0 ? 'down' : delta > 0 ? 'up' : 'flat');

/** Arrow of the score trend: every value is an `IconName` of deep-ink. */
export const trendIcon = (delta: number): 'arrow-down' | 'arrow-up' | 'dash' => (delta < 0 ? 'arrow-down' : delta > 0 ? 'arrow-up' : 'dash');

/** Text of the score trend before "run #N": `Same as` or `14 pts vs`. */
export const trendText = (delta: number) => (delta === 0 ? 'Same as' : `${Math.abs(delta)} pts vs`);

/** Word of the verdict: `Passed`, `Failed` or `Timed out`. */
export const verdictWord = (result: TestResult) => (result === 'passed' ? 'Passed' : result === 'failed' ? 'Failed' : 'Timed out');

/** Icon of the verdict: every value is an `IconName` of deep-ink. */
export const verdictIcon = (result: TestResult): 'check' | 'cross' | 'clock' => (result === 'passed' ? 'check' : result === 'failed' ? 'cross' : 'clock');

/** Operations part of the verdict summary: all of them match their contract, or how many broke it. */
export const operationsSummary = (broken: number, total: number) =>
  broken === 0 ? `all ${total} operations match their contract` : `${broken} of ${total} operations broke ${broken === 1 ? 'its' : 'their'} contract`;

/** Status of the result badge: every value is a `ProofStatus` of deep-ink. */
export const resultStatus = (result: TestResult): 'success' | 'danger' | 'warning' => (result === 'passed' ? 'success' : result === 'failed' ? 'danger' : 'warning');

/** Name of the schema the first failed step breaks (`Pastry`), if any. */
export const failedSchemaName = (run: Pick<TestRun, 'steps'>) => firstFailedStep(run)?.schemaRef?.split('/').pop();

/** Status label of a playing run: `Running · step 5 of 7`. */
export const runningLabel = (tick: number, total: number) => `Running · step ${Math.min(tick + 1, total)} of ${total}`;

/** What the runner calls now (`GET https://…/pastries/Eclair%20Cafe`), or the score computation after the last step. */
export const nowCalling = (current: Pick<TestStepResult, 'method' | 'path'> | undefined, endpoint: string) =>
  current ? `${current.method} ${endpoint}${current.path}` : 'Computing conformance score…';

/** Counts under the progress bar: every kind is a count kind of deep-ink's `RunProgress`. */
export const progressCounts = (counts: { pass: number; fail: number; queued: number }): { kind: 'pass' | 'fail' | 'pending'; text: string }[] => [
  { kind: 'pass', text: `${counts.pass} passed` },
  { kind: 'fail', text: `${counts.fail} failed` },
  { kind: 'pending', text: `${counts.queued} queued` },
];

/** Conformance band of the run: one cell per operation, untested until the operation is done. */
export const operationOutcomes = (opStates: StepState[]): BandOutcome[] => opStates.map((s) => (s === 'pass' ? 'pass' : s === 'fail' ? 'fail' : 'untested'));

/** Label of each band cell: `GET /pastries · passed`. */
export const operationBandLabels = (operations: RunOperation[], opStates: StepState[]) =>
  operations.map((op, i) => `${op.method} ${op.path} · ${STEP_LOOK[opStates[i] ?? 'pend'].word.toLowerCase()}`);

/** Lines of the runner log, as deep-ink's `RunnerLog` takes them. */
export const runnerLogLines = (log: LogLine[]) =>
  log.map((l) => ({ time: l.time, level: l.level, text: l.message, emphasis: l.tone === 'emphasis', error: l.tone === 'error' }));

/** Value of a step's schema badge: `Conformant`, or its number of violations. */
export const schemaBadgeValue = (step: Pick<TestStepResult, 'result' | 'violations'>) =>
  step.result === 'failed' ? `${step.violations.length} ${step.violations.length === 1 ? 'violation' : 'violations'}` : 'Conformant';

/** Name of the schema a step is checked against (`Pastry`), `the schema` without a reference. */
export const stepSchemaName = (step: Pick<TestStepResult, 'schemaRef'>) => step.schemaRef?.split('/').pop() ?? 'the schema';

/** Value a step's body has that the contract does not list, from its first `Enum value "…"` violation. */
export const newEnumValue = (step: Pick<TestStepResult, 'violations'>) => step.violations.map((v) => /^Enum value "([^"]+)"/.exec(v.message)?.[1]).find(Boolean);

/** Operation of a step (`PATCH /pastries/{name}`): its label in the run, else the step's method and path. */
export function stepOperationText(run: Pick<TestRun, 'operationLabels'>, step: Pick<TestStepResult, 'operationId' | 'method' | 'path'>): string {
  const label = run.operationLabels?.find((o) => o.id === step.operationId);
  return label ? `${label.method} ${label.path}` : `${step.method} ${step.path}`;
}

/** Sentence of a conformant step: what was checked against which schema, and that its status is declared. */
export function conformantSentence(step: Pick<TestStepResult, 'payload' | 'httpStatus' | 'schemaRef' | 'contract'>): string {
  const isArray = Array.isArray(step.payload);
  const n = isArray ? (step.payload as unknown[]).length : 1;
  const code = step.httpStatus ?? 200;
  const schema = stepSchemaName(step);
  const props = step.contract?.length ?? 0;
  return isArray
    ? `Conformant. ${n} ${n === 1 ? 'item' : 'items'} checked against ${schema}, ${props} properties each, 0 violations. Status ${code} is declared by the contract.`
    : `Conformant. ${props} properties checked against ${schema}, 0 violations. Status ${code} is declared by the contract.`;
}

/** Announcement of a finished run: `Test run #118 passed: 7 of 7 steps passed.` */
export const verdictAnnouncement = (run: Pick<TestRun, 'id' | 'result'>, passCount: number, total: number) =>
  `Test run #${run.id} ${TEST_RESULT_WORD[run.result].toLowerCase()}: ${passCount} of ${total} steps passed.`;

/** Announcement of a finished step: `Step 4 of 7: Millefeuille passed.` */
export const stepAnnouncement = (finished: number, total: number, step: Pick<TestStepResult, 'name' | 'result'>) => `Step ${finished} of ${total}: ${step.name} ${step.result}.`;
