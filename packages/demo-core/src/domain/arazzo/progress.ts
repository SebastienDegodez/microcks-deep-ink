import type { StepResult, WorkflowRun } from './run.js';

const blank = (step: StepResult): StepResult => ({
  ...step,
  status: 'not-run',
  attempts: [],
  request: undefined,
  response: undefined,
  criteria: [],
  outputs: {},
  schema: { ...step.schema, state: 'off' },
  flow: { kind: 'next', title: '', text: '' },
});

/**
 * The successive states of a run while it executes, derived from its final result. One frame per
 * attempt: the step being called is `current` (an attempt above 1 is a retry) and keeps only the
 * attempts that already ended. The last frame IS the final run. Steps that never ran are not part of
 * the sequence.
 */
export function runFrames(run: WorkflowRun): WorkflowRun[] {
  const executed = run.steps.filter((s) => s.status !== 'not-run');
  if (executed.length === 0) return [run];
  const frames: WorkflowRun[] = [];
  const settled = new Map<string, StepResult>();

  const frame = (current: WorkflowRun['current'], partial?: StepResult): WorkflowRun => ({
    ...run,
    status: 'RUNNING',
    outputs: {},
    current,
    steps: run.steps.map((s) => settled.get(s.stepId) ?? (partial && partial.stepId === s.stepId ? partial : blank(s))),
  });

  frames.push(frame({ stepId: (executed[0] as StepResult).stepId, attempt: 1 }));
  executed.forEach((step, index) => {
    for (let k = 1; k < step.attempts.length; k++) {
      const partial: StepResult = { ...blank(step), attempts: step.attempts.slice(0, k) };
      frames.push(frame({ stepId: step.stepId, attempt: k + 1 }, partial));
    }
    settled.set(step.stepId, step);
    const next = executed[index + 1];
    if (next) frames.push(frame({ stepId: next.stepId, attempt: 1 }));
  });
  frames.push(run);
  return frames;
}
