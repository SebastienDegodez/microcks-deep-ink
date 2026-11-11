import { allCriteriaHold, evaluateCriterion, resolveExpression, type EvaluationContext } from './expression.js';
import type { Action, Step, Workflow } from './workflow.js';
import type { StepStatus } from './run.js';

type Dependent = Pick<Step, 'stepId' | 'dependsOn'>;

/**
 * Parallel execution layers, using the SAME rule as the Loom layout (`layoutLoom`):
 * - no step declares `dependsOn` -> sequential: every step is its own layer;
 * - otherwise steps without `dependsOn` are roots and run in parallel (layer 0);
 * - layer = longest-path depth. Steps keep declaration order inside a layer.
 *
 * Throws on an unknown dependency or a cycle.
 */
export function executionLayers(steps: readonly Dependent[]): string[][] {
  if (steps.length === 0) return [];
  const anyDepends = steps.some((s) => s.dependsOn && s.dependsOn.length > 0);
  if (!anyDepends) return steps.map((s) => [s.stepId]);

  const byId = new Map(steps.map((s) => [s.stepId, s]));
  const depth = new Map<string, number>();
  const visiting = new Set<string>();
  const depthOf = (id: string): number => {
    const known = depth.get(id);
    if (known !== undefined) return known;
    if (visiting.has(id)) throw new Error(`Cycle in step dependencies at "${id}"`);
    visiting.add(id);
    const step = byId.get(id);
    if (!step) throw new Error(`Unknown step "${id}" in dependsOn`);
    const deps = step.dependsOn ?? [];
    const d = deps.length === 0 ? 0 : 1 + Math.max(...deps.map(depthOf));
    visiting.delete(id);
    depth.set(id, d);
    return d;
  };
  const layers: string[][] = [];
  for (const s of steps) {
    const d = depthOf(s.stepId);
    (layers[d] ??= []).push(s.stepId);
  }
  return layers;
}

export interface StepOutcome {
  /** Success criteria held (and the schema validated, when it is on). */
  passed: boolean;
  /** 1-based number of the attempt that has just finished. */
  attempt: number;
  /** Context used to evaluate the criteria of an action. */
  context?: EvaluationContext;
}

export type StepFlow =
  | { kind: 'next' }
  | {
      kind: 'end';
      outcome: 'success' | 'failure';
      reason: 'end-action' | 'no-failure-action' | 'retry-limit-reached';
      actionName?: string;
    }
  | { kind: 'retry'; actionName: string; afterSeconds: number; nextAttempt: number };

function applies(action: Action, ctx: EvaluationContext | undefined): boolean {
  if (!action.criteria || action.criteria.length === 0) return true;
  return ctx !== undefined && allCriteriaHold(action.criteria, ctx);
}

/**
 * What happens after an attempt of a step: retry, end or next. Only `retry` and `end`
 * exist (no goto). `retryLimit` is the number of RETRIES, so a step with retryLimit 2 is
 * called at most 3 times.
 *
 * - passed: the first `onSuccess` action whose criteria hold; `end` stops the run with SUCCESS,
 *   otherwise `next`.
 * - failed: the first `onFailure` action whose criteria hold; `retry` until the limit, then the
 *   run ends with FAILURE; no action means the run ends with FAILURE.
 */
export function nextAfterStep(step: Pick<Step, 'onSuccess' | 'onFailure'>, result: StepOutcome): StepFlow {
  if (result.passed) {
    const end = step.onSuccess.find((a) => a.type === 'end' && applies(a, result.context));
    return end ? { kind: 'end', outcome: 'success', reason: 'end-action', actionName: end.name } : { kind: 'next' };
  }
  const action = step.onFailure.find((a) => applies(a, result.context));
  if (!action) return { kind: 'end', outcome: 'failure', reason: 'no-failure-action' };
  if (action.type === 'end') return { kind: 'end', outcome: 'failure', reason: 'end-action', actionName: action.name };
  if (result.attempt <= action.retryLimit) {
    return { kind: 'retry', actionName: action.name, afterSeconds: action.retryAfter, nextAttempt: result.attempt + 1 };
  }
  return { kind: 'end', outcome: 'failure', reason: 'retry-limit-reached', actionName: action.name };
}

/** What a target (mock or implementation) answered to one call. */
export interface StepResponse {
  statusCode: number;
  body?: unknown;
  headers?: Record<string, string>;
  ms: number;
  /** Schema validation of the response; undefined when validation is off or not applicable. */
  schema?: 'pass' | 'fail';
}

export type Responder = (step: Step, attempt: number, ctx: EvaluationContext) => StepResponse;

export interface PlayedAttempt {
  n: number;
  statusCode: number;
  ms: number;
  criteriaHeld: boolean;
  schema: 'pass' | 'fail' | 'off';
  passed: boolean;
}

export interface PlayedStep {
  stepId: string;
  status: StepStatus;
  attempts: PlayedAttempt[];
  /** Flow decided after the LAST attempt. */
  flow: StepFlow;
  outputs: Record<string, unknown>;
}

export interface PlayedRun {
  status: 'SUCCESS' | 'FAILURE';
  steps: PlayedStep[];
  /** Step after which the run stopped early (end action, or failure). */
  stoppedAt?: string;
  outputs: Record<string, unknown>;
}

/**
 * Pure simulation of the WorkflowRunner semantics (success criteria, optional schema
 * validation, retry and end actions). Steps are played layer by layer; steps of a layer
 * are played in declaration order. Phase 2 (WP8) builds on it for the in-memory runner.
 */
export function playWorkflow(
  workflow: Pick<Workflow, 'steps' | 'outputs'>,
  respond: Responder,
  options: { inputs: Record<string, unknown>; validateSchemas: boolean },
): PlayedRun {
  const order = executionLayers(workflow.steps).flat();
  const byId = new Map(workflow.steps.map((s) => [s.stepId, s]));
  const ctxSteps: Record<string, { outputs: Record<string, unknown> }> = {};
  const played: PlayedStep[] = [];
  let status: PlayedRun['status'] = 'SUCCESS';
  let stoppedAt: string | undefined;

  for (const id of order) {
    const step = byId.get(id) as Step;
    if (stoppedAt) {
      played.push({ stepId: id, status: 'not-run', attempts: [], flow: { kind: 'next' }, outputs: {} });
      continue;
    }
    const attempts: PlayedAttempt[] = [];
    let attempt = 1;
    let flow: StepFlow = { kind: 'next' };
    let outputs: Record<string, unknown> = {};
    let passed = false;
    for (;;) {
      const base: EvaluationContext = { inputs: options.inputs, steps: ctxSteps };
      const response = respond(step, attempt, base);
      const ctx: EvaluationContext = { ...base, statusCode: response.statusCode, body: response.body, headers: response.headers };
      const criteriaHeld = allCriteriaHold(step.successCriteria, ctx);
      const schema = options.validateSchemas && response.schema ? response.schema : 'off';
      passed = criteriaHeld && schema !== 'fail';
      attempts.push({ n: attempt, statusCode: response.statusCode, ms: response.ms, criteriaHeld, schema, passed });
      flow = nextAfterStep(step, { passed, attempt, context: ctx });
      if (passed) {
        outputs = Object.fromEntries(step.outputs.map((o) => [o.name, resolveExpression(o.expression, ctx)]));
        ctxSteps[step.stepId] = { outputs };
      }
      if (flow.kind !== 'retry') break;
      attempt = flow.nextAttempt;
    }
    played.push({ stepId: id, status: passed ? 'passed' : 'failed', attempts, flow, outputs });
    if (flow.kind === 'end') {
      stoppedAt = id;
      status = flow.outcome === 'success' ? 'SUCCESS' : 'FAILURE';
    }
  }

  const outputs: Record<string, unknown> = {};
  if (status === 'SUCCESS') {
    for (const o of workflow.outputs) {
      const value = resolveExpression(o.expression, { inputs: options.inputs, steps: ctxSteps });
      if (value !== undefined) outputs[o.name] = value;
    }
  }
  return { status, steps: played, stoppedAt, outputs };
}

/** Convenience used by pages that show the evaluation of a criterion list. */
export function evaluateAll(step: Pick<Step, 'successCriteria'>, ctx: EvaluationContext) {
  return step.successCriteria.map((c) => ({ condition: c.condition, ...evaluateCriterion(c, ctx) }));
}
