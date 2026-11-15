import { judgeExample, resolveExpression, runContext, stoppedStep, verdictExplanation, type ExampleExpectation, type Step, type Workflow, type WorkflowExample, type WorkflowRun } from '../../domain/arazzo/index.js';
import { implementationsText, type RunApiBody } from './api.js';
import { phaseOf } from './steps.js';

/** Gap between two replayed frames once the replay is behind the stream (after a pause), in ms. */
export const REPLAY_TICK_MS = 1000;

/** JSON-ish value as the prototype prints it: `"Eclair Cafe"`, `3.9`. */
export const jsonText = (v: unknown) => JSON.stringify(v);

/** Index of the step being called, or the step count once the run has ended. */
export function currentIndexOf(run: WorkflowRun): number {
  return run.status === 'RUNNING' ? Math.max(0, run.steps.findIndex((s) => s.stepId === run.current?.stepId)) : run.steps.length;
}

/** "Running · step 2 of 3 · attempt 2" for the status chip of a live run. */
export function runningLabel(run: WorkflowRun, currentIndex: number): string {
  const total = run.steps.length;
  return `Running · step ${Math.min(currentIndex + 1, total)} of ${total}${run.current && run.current.attempt > 1 ? ` · attempt ${run.current.attempt}` : ''}`;
}

/** Announced when the current step changes: "Step 2 of 3, patchPastry, running.". */
export const stepAnnouncement = (currentIndex: number, total: number, stepId: string) => `Step ${currentIndex + 1} of ${total}, ${stepId}, running.`;

/** Announced when the run ends: its headline and detail. */
export const endAnnouncement = (title: string, detail: string) => `${title}. ${detail}`.trim();

/** Who launched the run, in the header facts. */
export function launchedBy(run: WorkflowRun): string {
  if (run.origin.kind === 'session') return run.origin.app;
  if (run.origin.kind === 'api') return 'API';
  if (run.origin.kind === 'mock-url') return 'Mock URL';
  return 'MA';
}

/** What the run calls, in the header facts. */
export function targetLine(run: WorkflowRun): string {
  if (run.target.kind === 'mocks') return 'Microcks mocks';
  if (run.target.kind === 'implementations') return `Implementations · ${implementationsText(run.target.baseUrls)}`;
  return 'Mixed · proposed, beyond POC';
}

/** The `POST …/runs` body that launches the same run. */
export function apiBodyOf(run: WorkflowRun): RunApiBody {
  return {
    inputs: run.options.inputs,
    timeout: run.options.timeoutMs,
    ...(run.target.kind === 'implementations' ? { implementations: run.target.baseUrls } : {}),
    ...(run.target.kind !== 'mocks' && run.options.secret ? { secretName: run.options.secret } : {}),
    validateSchema: run.options.validateSchemas,
    ...(run.options.example ? { example: run.options.example } : {}),
  };
}

/** URL a step calls, resolved from the inputs and the outputs the run has so far (before its request exists). */
export function resolvedUrl(run: WorkflowRun, def: Step): string {
  const ctx = runContext(run);
  let path = def.path;
  const query: string[] = [];
  for (const p of def.parameters) {
    const v = p.value.startsWith('$') ? resolveExpression(p.value, ctx) : p.value;
    const text = v === undefined ? `{${p.name}}` : String(v);
    if (p.in === 'path') path = path.replace(`{${p.name}}`, encodeURIComponent(text));
    else if (p.in === 'query') query.push(`${p.name}=${encodeURIComponent(text)}`);
  }
  const base = run.target.kind === 'implementations' ? (run.target.baseUrls[def.sourceName] ?? '') : (run.steps.find((x) => x.request)?.request?.url.replace(/\/pastries.*$/, '') ?? '');
  return `${base}${path}${query.length ? `?${query.join('&')}` : ''}`;
}

/** One segment of the live progress bar. */
export type ProgressSegment = 'done' | 'failed' | 'current' | 'queued';

/** The live progress of a running run: steps ended, what is called now, one segment per step. */
export interface RunProgressView {
  done: number;
  total: number;
  nowTitle: string;
  now: string;
  segments: ProgressSegment[];
}

/** The live progress of a running run, from the step being called. */
export function progressOf(run: WorkflowRun, workflow: Workflow | undefined, currentIndex: number): RunProgressView {
  const total = run.steps.length;
  const current = run.current ? run.steps.find((s) => s.stepId === run.current?.stepId) : undefined;
  const retrying = run.current && run.current.attempt > 1;
  const nowTitle = !current ? 'Now calling' : retrying ? `Retrying · attempt ${run.current?.attempt} of ${current.attempts.length}` : 'Now calling';
  const def = workflow?.steps.find((s) => s.stepId === current?.stepId);
  const target = current?.request ? `${current.request.method} ${current.request.url}` : def ? `${def.method} ${resolvedUrl(run, def)}` : '';
  const now = !current ? 'All steps ended · computing the result…' : retrying ? `retryAfter → ${target}` : target;
  const segments = run.steps.map((s, i): ProgressSegment => {
    const ph = phaseOf(run, i);
    if (ph === 'running') return 'current';
    if (ph !== 'done') return 'queued';
    return s.status === 'passed' ? 'done' : s.status === 'failed' ? 'failed' : 'queued';
  });
  return { done: Math.min(currentIndex, total), total, nowTitle, now, segments };
}

/** The verdict sentence; a run ended early by an onSuccess end says which criterion held and what it spared. */
export function explanationOf(run: WorkflowRun, workflow?: Workflow): string {
  const stopped = stoppedStep(run);
  if (run.status !== 'SUCCESS' || !stopped) return verdictExplanation(run);
  const action = workflow?.steps.find((s) => s.stepId === stopped.stepId)?.onSuccess.find((a) => a.type === 'end');
  const held = action?.criteria?.map((c) => c.condition).join(' and ');
  const name = run.workflowId === 'restock-pastry' ? run.outputs['pastryName'] : undefined;
  return `${stopped.stepId}'s onSuccess end applied${held ? `: ${held} held` : ''}${typeof name === 'string' ? `, so ${name} needs no restock` : ''}. The run ended with SUCCESS; its outputs come from the steps it reached.`;
}

/** Why a finished run shows no workflow output. */
export function noOutputsText(run: WorkflowRun): string {
  return run.status === 'SUCCESS' ? 'None.' : `None: the workflow stopped at ${stoppedStep(run)?.stepId ?? 'a step'} and produced no outputs.`;
}

/** The step definition behind "Open operation": where the run stopped, else the last step that ran. */
export function openOperationOf(run: WorkflowRun, workflow: Workflow | undefined): Step | undefined {
  const step = stoppedStep(run) ?? [...run.steps].reverse().find((s) => s.status !== 'not-run');
  return workflow?.steps.find((s) => s.stepId === step?.stepId);
}

/** "apiPastry · /rest/API+Pastry/2.0": the mock endpoint of each source a mocks run calls. */
export function mockSources(run: WorkflowRun): string {
  return [...new Set(run.steps.flatMap((s) => (s.request ? [s.request.url] : [])))]
    .map((u) => u.match(/^https?:\/\/[^/]+(\/rest\/[^/]+\/[^/]+)/)?.[1])
    .filter((x, i, all): x is string => !!x && all.indexOf(x) === i)
    .map((p) => `apiPastry · ${p}`)
    .join(' · ');
}

/** One column of the steps band: the criteria bar, the schema bar and their words. */
export interface BandStep {
  id: string;
  status: WorkflowRun['steps'][number]['status'];
  word: string;
  criteria: 'none' | 'pass' | 'fail';
  schema: 'none' | 'pass' | 'fail' | 'off' | 'na';
}

/** Upper bar = success criteria, lower bar = schema validation, one column per step. */
export function stepsBand(run: WorkflowRun): BandStep[] {
  return run.steps.map((s) => {
    const notRun = s.status === 'not-run';
    const criteriaOk = s.criteria.every((c) => c.held);
    const schema = s.schema.state;
    const word = notRun
      ? 'not run'
      : `${criteriaOk ? 'criteria held' : 'criteria failed'} · ${schema === 'pass' ? 'schema passed' : schema === 'fail' ? 'schema failed' : schema === 'na' ? 'schema n/a' : 'schema off'}`;
    return { id: s.stepId, status: s.status, word, criteria: notRun ? 'none' : criteriaOk ? 'pass' : 'fail', schema: notRun ? 'none' : schema };
  });
}

/** Accessible name of the steps band. */
export const stepsBandLabel = (band: readonly BandStep[]) => `Steps band: ${band.map((b) => `${b.id} ${b.word}`).join('; ')}`;

/** The expectations of an example against a run; while the run plays, every row waits for its end. */
export function exampleJudging(run: WorkflowRun, example: WorkflowExample, pending: boolean): { rows: ExampleExpectation[]; unmet: string[]; matches: boolean } {
  const judged = judgeExample(run, example);
  return {
    rows: pending ? judged.rows.map((r) => ({ ...r, got: '…' })) : judged.rows,
    unmet: pending ? [] : judged.unmet,
    matches: judged.matches,
  };
}

/** The example verdict of the Properties panel. */
export function exampleVerdict(run: WorkflowRun, example: WorkflowExample | undefined): string | undefined {
  if (!example) return undefined;
  return run.status === 'RUNNING' ? 'Judged once the run ends' : judgeExample(run, example).matches ? 'Matches' : 'Does not match';
}

/** Kind of target in the Properties panel. */
export function targetKindLabel(run: WorkflowRun): string {
  return run.target.kind === 'mocks' ? 'Microcks mocks' : run.target.kind === 'implementations' ? 'Implementations' : 'Mixed';
}

/** "size = M · …", or "none". */
export function inputsText(run: WorkflowRun): string {
  return (
    Object.entries(run.options.inputs)
      .map(([k, v]) => `${k} = ${String(v)}`)
      .join(' · ') || 'none'
  );
}

/** `pastryName = "Eclair Cafe" · …`. */
export function outputsText(run: WorkflowRun): string {
  return Object.entries(run.outputs)
    .map(([k, v]) => `${k} = ${jsonText(v)}`)
    .join(' · ');
}

/** Where the run comes from, in the Properties panel. */
export function originText(run: WorkflowRun): string {
  if (run.origin.kind === 'session') return `Session ${run.origin.sessionId}`;
  if (run.origin.kind === 'ui') return 'UI · Run workflow';
  if (run.origin.kind === 'api') return 'API';
  return 'Mock URL';
}
