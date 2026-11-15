import { handoversOf, runContext, stoppedStep, type Action, type Handover, type Step, type StepResult, type Workflow, type WorkflowRun } from '../../domain/arazzo/index.js';

/** Where a step stands in a run that may still be running. */
export type Phase = 'done' | 'running' | 'waiting';

/** Where a step stands in a run that may still be running. */
export function phaseOf(run: WorkflowRun, index: number): Phase {
  if (run.status !== 'RUNNING') return 'done';
  const currentIndex = run.steps.findIndex((s) => s.stepId === run.current?.stepId);
  if (currentIndex < 0) return run.steps[index]?.status === 'not-run' ? 'waiting' : 'done';
  return index < currentIndex ? 'done' : index === currentIndex ? 'running' : 'waiting';
}

/** Visual state of a step: passed, failed, running, queued or not run. */
export type StepLook = 'pass' | 'fail' | 'run' | 'pend' | 'notrun';

/** The word of each visual state. */
export const STEP_WORD: Record<StepLook, string> = { pass: 'Passed', fail: 'Failed', run: 'Running', pend: 'Queued', notrun: 'Not run' };

/** Visual state of a step from its result and its phase. */
export function lookOf(step: StepResult, phase: Phase): StepLook {
  if (phase === 'running') return 'run';
  if (phase === 'waiting') return 'pend';
  return step.status === 'passed' ? 'pass' : step.status === 'failed' ? 'fail' : 'notrun';
}

/** A handed-over or output value as JSON, a dash when absent. */
export const valueText = (v: unknown) => (v === undefined ? '—' : JSON.stringify(v));

/** "182 ms". */
export const msText = (n: number) => `${n} ms`;

/** "patchPastry failed after 3 attempts and ended the run", "onSuccess end of getPastry ended the run". */
export function stopText(run: WorkflowRun): string {
  const stopped = stoppedStep(run);
  if (!stopped) return 'the run ended';
  if (stopped.status === 'passed') return `onSuccess end of ${stopped.stepId} ended the run`;
  const n = stopped.attempts.length;
  return `${stopped.stepId} failed${n > 1 ? ` after ${n} attempts` : ''} and ended the run`;
}

/** The field a bad response line breaks, in words: `"price": "3.9",` → "/price is a string". */
export function badFieldText(step: StepResult): string {
  const bad = step.response?.lines.find((l) => l.bad);
  const m = bad?.text.match(/"([^"]+)":\s*(.+?),?$/);
  if (!m) return 'see the response';
  const value = m[2] ?? '';
  const kind = value.startsWith('"') ? 'a string' : value === 'null' ? 'null' : value.startsWith('{') ? 'an object' : value.startsWith('[') ? 'an array' : 'a number';
  return `/${m[1]} is ${kind}`;
}

/** Whether a step passed and its onSuccess end ended the run. */
export function endsOnSuccess(step: StepResult): boolean {
  return step.status === 'passed' && step.flow.kind === 'end';
}

/** The source descriptions a workflow calls, in step order. */
export function threadSources(workflow: Workflow | undefined): string[] {
  return [...new Set((workflow?.steps ?? []).map((s) => s.sourceName))];
}

/** One step of the timeline with the baton before it (the values handed over from the previous steps). */
export interface TimelineRow {
  step: StepResult;
  def: Step | undefined;
  look: StepLook;
  /** The previous step, waited for by the baton. */
  prev: StepResult | undefined;
  /** Not run because the run ended before it. */
  skipped: boolean;
  /** The previous step is done and passed: the baton is handed over. */
  ready: boolean;
  handovers: Handover[];
  /** The rail under the node is lit: the step passed and the run goes on. */
  lineOn: boolean;
  last: boolean;
}

/** The rows of the steps timeline of a run, finished or running. */
export function timelineRows(run: WorkflowRun, workflow: Workflow | undefined): TimelineRow[] {
  const ctx = runContext(run);
  const ended = run.status !== 'RUNNING';
  const total = run.steps.length;
  return run.steps.map((step, i) => {
    const def = workflow?.steps.find((s) => s.stepId === step.stepId);
    const look = lookOf(step, phaseOf(run, i));
    const prev = i > 0 ? run.steps[i - 1] : undefined;
    const prevDone = i === 0 || (prev !== undefined && phaseOf(run, i - 1) === 'done' && prev.status === 'passed');
    const skipped = step.status === 'not-run' && ended;
    const endsHere = look === 'pass' && step.flow.kind === 'end';
    return {
      step,
      def,
      look,
      prev,
      skipped,
      ready: !skipped && prevDone,
      handovers: def ? handoversOf(def, ctx) : [],
      lineOn: look === 'pass' && !endsHere,
      last: i === total - 1,
    };
  });
}

/** The retry action of a step, if it has one. */
export function retryOf(def: Step | undefined): Extract<Action, { type: 'retry' }> | undefined {
  const retry = def?.onFailure.find((a) => a.type === 'retry');
  return retry && retry.type === 'retry' ? retry : undefined;
}

/** A tag of a step card: its onSuccess end or its retries. */
export interface StepTag {
  text: string;
  tone: 'neutral' | 'warning' | 'success';
}

/** "onSuccess end · quantity gt 0", "retried ×2 · 1 s" or "onFailure retry ×2 · 1 s". */
export function stepTags(step: StepResult, def: Step | undefined, look: StepLook): StepTag[] {
  const tags: { text: string; tone: 'secondary' | 'warning' | 'success' | 'muted' }[] = [];
  const end = def?.onSuccess.find((a) => a.type === 'end');
  const retry = retryOf(def);
  if (end && end.type === 'end') {
    const cond = end.criteria?.[0]?.condition.replace('$response.body#/', '') ?? '';
    tags.push({ text: `onSuccess end${cond ? ` · ${cond}` : ''}`, tone: endsOnSuccess(step) ? 'success' : 'secondary' });
  }
  if (retry) {
    const retried = step.attempts.length > 1;
    tags.push({ text: `${retried ? 'retried' : 'onFailure retry'} ×${retried ? step.attempts.length - 1 : retry.retryLimit} · ${retry.retryAfter} s`, tone: retried ? 'warning' : look === 'notrun' ? 'muted' : 'secondary' });
  }
  return tags.map((t) => ({ text: t.text, tone: t.tone === 'warning' || t.tone === 'success' ? t.tone : 'neutral' }));
}

/** Duration column of a step card: "200 · 182 ms", "3 attempts · 95 ms", "…" while it runs, else a dash. */
export function stepMsLabel(step: StepResult, look: StepLook): string {
  const finished = look === 'pass' || look === 'fail';
  const lastAttempt = step.attempts[step.attempts.length - 1];
  if (finished && lastAttempt) return step.attempts.length > 1 ? `${step.attempts.length} attempts · ${msText(lastAttempt.ms)}` : `${lastAttempt.httpStatus} · ${msText(lastAttempt.ms)}`;
  return look === 'run' ? '…' : '—';
}

/** Status of the running step: "Running", or "Retrying · attempt 2 of 3". */
export function runningStepLabel(run: WorkflowRun, def: Step | undefined): string {
  return run.current && run.current.attempt > 1 ? `Retrying · attempt ${run.current.attempt} of ${(retryOf(def)?.retryLimit ?? 0) + 1}` : STEP_WORD.run;
}

/** One attempt of a retried step: its outcome and what followed. */
export interface AttemptRow {
  n: number;
  httpStatus: number;
  ms: number;
  outcome: string;
  next: string;
  failed: boolean;
}

/** The attempts of a retried step, with the outcome of each and the action it triggered. */
export function attemptRows(step: StepResult, retry: Extract<Action, { type: 'retry' }>): AttemptRow[] {
  const criteriaOk = step.criteria.every((c) => c.held);
  return step.attempts.map((a, k) => {
    const isLast = k === step.attempts.length - 1;
    const outcome = `${criteriaOk ? 'Success criteria held' : 'Success criteria did not hold'}${step.schema.state === 'fail' ? ` · schema validation failed: ${badFieldText(step)}` : ''}`;
    const next = isLast
      ? step.status === 'passed'
        ? 'the step passes'
        : 'retry limit reached, the step fails'
      : `onFailure retry ${k + 1} of ${retry.retryLimit} after ${retry.retryAfter} s`;
    return { n: a.n, httpStatus: a.httpStatus, ms: a.ms, outcome, next, failed: !(isLast && step.status === 'passed') };
  });
}

/** Accessible name of a step response: "Response of patchPastry, attempt 3". */
export function responseCaption(step: StepResult): string {
  return `Response of ${step.stepId}${step.attempts.length > 1 ? `, attempt ${step.attempts.length}` : ''}`;
}

/** What the running step waits for: "Waiting for PATCH …/pastries/Eclair%20Cafe…", "Waiting for attempt 2…". */
export function waitingText(run: WorkflowRun, step: StepResult): string {
  return run.current && run.current.attempt > 1 ? `Waiting for attempt ${run.current.attempt}…` : `Waiting for ${step.request ? `${step.request.method} ${step.request.url}` : 'the response'}…`;
}

/** Schema reference line of a step, with the hint of the option when validation was off. */
export function schemaRefText(step: StepResult): string {
  return step.schema.ref || (step.schema.state === 'off' ? 'Validate each response against its OpenAPI schema · off' : '');
}

/** Glyph of the flow note: next step, end of the run or stop. */
export function flowIcon(kind: StepResult['flow']['kind']): 'arrow-right' | 'stop' | 'x-circle' {
  return kind === 'next' ? 'arrow-right' : kind === 'end' ? 'stop' : 'x-circle';
}

/** Why a step shows no output. */
export function noStepOutputsText(step: StepResult): string {
  return step.status === 'failed' ? 'None: a failed step produces no outputs.' : 'None declared.';
}

/** The AI Copilot page that generates the example a mocks run did not find. */
export const copilotExamplePath = (hint: string) => `/services/pastry2/copilot?op=get-name&hint=${encodeURIComponent(hint)}`;
