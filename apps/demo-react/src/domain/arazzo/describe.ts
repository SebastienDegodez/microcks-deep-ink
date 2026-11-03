import type { StepResult, StepStatus, WorkflowRun } from './run';
import type { Action, Criterion, Step } from './workflow';

/** "$statusCode == 200" or "status is …"; several criteria are joined with " and ". */
export function criteriaText(criteria: readonly Criterion[] | undefined): string {
  if (!criteria || criteria.length === 0) return '';
  return criteria.map((c) => c.condition).join(' and ');
}

/** Short label of an action, as the Loom writes it: "retry ×2 · 1 s", "end if $response.body#/status == 'available'". */
export function actionLabel(action: Action): string {
  if (action.type === 'retry') return `retry ×${action.retryLimit} · ${action.retryAfter} s`;
  const when = criteriaText(action.criteria);
  return when ? `end if ${when}` : 'end';
}

/** An action in words (retry and end only, there is no goto). */
export function describeAction(action: Action): string {
  if (action.type === 'retry') {
    const times = action.retryLimit === 1 ? 'once' : `up to ${action.retryLimit} times`;
    return `Retry ${times}, waiting ${action.retryAfter} s between attempts`;
  }
  const when = criteriaText(action.criteria);
  return when ? `End the workflow when ${when}` : 'End the workflow';
}

/** Where an action sits: `onSuccess` or `onFailure`. */
export function actionsOf(step: Pick<Step, 'onSuccess' | 'onFailure'>): { when: 'onSuccess' | 'onFailure'; action: Action }[] {
  return [
    ...step.onSuccess.map((action) => ({ when: 'onSuccess' as const, action })),
    ...step.onFailure.map((action) => ({ when: 'onFailure' as const, action })),
  ];
}

const WORD: Record<StepStatus, string> = { passed: 'passed', failed: 'failed', 'not-run': 'not run' };

/** Text alternative of the mini step strip: "4 steps: passed, passed, failed, not run". */
export function stepStripAlt(statuses: readonly StepStatus[]): string {
  if (statuses.length === 0) return 'No step';
  return `${statuses.length} ${statuses.length === 1 ? 'step' : 'steps'}: ${statuses.map((s) => WORD[s]).join(', ')}`;
}

/** The step where a run stopped (end action or failure), if it did. */
export function stoppedStep(run: Pick<WorkflowRun, 'steps'>): StepResult | undefined {
  return run.steps.find((s) => s.status !== 'not-run' && s.flow.kind !== 'next');
}

/** Passed / failed as shown in the lists; a RUNNING run counts as neither. */
export function runOutcome(run: Pick<WorkflowRun, 'status'>): 'passed' | 'failed' | 'running' {
  return run.status === 'SUCCESS' ? 'passed' : run.status === 'FAILURE' ? 'failed' : 'running';
}

/** Headline of a run for the summary callout: "Run #14 failed" + "Stops at patchPastry · schema validation, 3 attempts". */
export function runHeadline(run: WorkflowRun): { title: string; detail: string } {
  if (run.status === 'RUNNING') return { title: `Run #${run.number} is running`, detail: '' };
  const stopped = stoppedStep(run);
  if (run.status === 'SUCCESS') {
    return {
      title: `Run #${run.number} passed`,
      detail: stopped ? `Ended early at ${stopped.stepId}` : 'Every step passed',
    };
  }
  if (!stopped) return { title: `Run #${run.number} failed`, detail: '' };
  const parts = [`Stops at ${stopped.stepId}`];
  if (stopped.schema.state === 'fail') parts.push('schema validation');
  const attempts = stopped.attempts.length;
  return { title: `Run #${run.number} failed`, detail: attempts > 1 ? `${parts.join(' · ')}, ${attempts} attempts` : parts.join(' · ') };
}

/** Why the run ended, in a sentence ("Step 3, patchPastry, failed after 3 attempts: …"). */
export function verdictExplanation(run: WorkflowRun): string {
  if (run.status === 'RUNNING') return '';
  const stopped = stoppedStep(run);
  if (run.status === 'SUCCESS') {
    if (stopped) return stopped.flow.text;
    const validated = run.options.validateSchemas && run.target.kind !== 'mocks';
    return `Every step passed its success criteria${validated ? ' and schema validation' : ''}.${
      run.target.kind !== 'mocks' && !run.options.validateSchemas
        ? ' Schema validation was off: the responses were not checked against their OpenAPI schema.'
        : ''
    }`;
  }
  if (!stopped) return 'The run failed.';
  const index = run.steps.findIndex((s) => s.stepId === stopped.stepId) + 1;
  const attempts = stopped.attempts.length;
  const head = `Step ${index}, ${stopped.stepId}, failed${attempts > 1 ? ` after ${attempts} attempts` : ''}`;
  const unheld = stopped.criteria.find((c) => !c.held);
  const reason =
    stopped.schema.state === 'fail'
      ? stopped.schema.message
      : unheld
        ? `Success criterion ${unheld.condition} did not hold: ${unheld.evaluation}`
        : stopped.flow.title;
  return `${head}: ${reason}. The workflow stopped there and produced no outputs.`;
}

/** Counts used by the summary: "2 passed · 1 failed · 1 not run". */
export function stepsTally(run: Pick<WorkflowRun, 'steps'>): string {
  const count = (status: StepStatus) => run.steps.filter((s) => s.status === status).length;
  return `${count('passed')} passed · ${count('failed')} failed · ${count('not-run')} not run`;
}

/** Total number of calls (all attempts of all steps) and the sum of their durations. */
export function callTotals(run: Pick<WorkflowRun, 'steps'>): { calls: number; ms: number } {
  let calls = 0;
  let ms = 0;
  for (const s of run.steps) {
    calls += s.attempts.length;
    for (const a of s.attempts) ms += a.ms;
  }
  return { calls, ms };
}
