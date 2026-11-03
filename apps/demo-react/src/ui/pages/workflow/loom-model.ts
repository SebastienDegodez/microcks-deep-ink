import {
  actionLabel,
  criteriaText,
  resolveExpression,
  type ArazzoDocument,
  type Step,
  type StepResult,
  type Workflow,
  type WorkflowRun,
} from '@/domain/arazzo';
import type { Protocol } from '@/domain/shared';

/**
 * Props of the `WorkflowLoom` element wrapper (plan section 3.4). The types are written here, identical to
 * the wrapper's, so the page does not depend on the file being copied yet.
 */
export type LoomStepStatus = 'passed' | 'failed' | 'not-run';
export type LoomCheckState = 'passed' | 'failed' | 'off' | 'not-evaluated';
export interface LoomSource {
  name: string;
  type: 'openapi' | 'asyncapi';
  protocol: Protocol;
  linked: boolean;
}
export type LoomAction =
  | { type: 'end'; name: string; on: 'success' | 'failure'; criteria: string; taken?: boolean }
  | { type: 'retry'; name: string; on: 'failure'; retryAfter: number; retryLimit: number; applied?: boolean };
export interface LoomStep {
  stepId: string;
  source: string;
  operation: string;
  dependsOn?: string[];
  status?: LoomStepStatus;
  attempts?: number;
  checks?: { successCriteria: LoomCheckState; schemaValidation?: LoomCheckState };
  actions?: LoomAction[];
}
export interface LoomThread {
  from: string;
  to: string;
  expression: string;
}
export interface LoomProps {
  sources: LoomSource[];
  steps: LoomStep[];
  threads: LoomThread[];
  inputs?: string[];
  outputs?: string[];
  validatesSchemas?: boolean;
  selectedStep?: string;
  label: string;
}

/** Runtime expressions of a step that read something produced elsewhere. */
export function expressionsOf(step: Step): string[] {
  const found = new Set<string>();
  const scan = (text: string) => {
    for (const m of text.matchAll(/\$(?:inputs\.[A-Za-z0-9_-]+|steps\.[A-Za-z0-9_-]+\.outputs\.[A-Za-z0-9_-]+)/g)) found.add(m[0]);
  };
  for (const p of step.parameters) scan(p.value);
  if (step.requestBody) scan(step.requestBody);
  return [...found];
}

/** Data threads: from an input or a step output to the step (or the workflow outputs) that consumes it. */
export function threadsOf(workflow: Pick<Workflow, 'steps' | 'outputs'>): LoomThread[] {
  const threads: LoomThread[] = [];
  const add = (expression: string, to: string) => {
    const from = expression.startsWith('$inputs.') ? '$inputs' : (/^\$steps\.([^.]+)\./.exec(expression)?.[1] ?? '$inputs');
    if (!threads.some((t) => t.expression === expression && t.to === to)) threads.push({ from, to, expression });
  };
  for (const step of workflow.steps) for (const expr of expressionsOf(step)) add(expr, step.stepId);
  for (const out of workflow.outputs) if (out.expression.startsWith('$')) add(out.expression, '$outputs');
  return threads;
}

function checksOf(result: StepResult | undefined, validate: boolean): LoomStep['checks'] | undefined {
  if (!result) return undefined;
  if (result.status === 'not-run') return { successCriteria: 'not-evaluated', schemaValidation: validate ? 'not-evaluated' : undefined };
  const criteria = result.criteria.every((c) => c.held) ? 'passed' : 'failed';
  const schema: LoomCheckState = result.schema.state === 'pass' ? 'passed' : result.schema.state === 'fail' ? 'failed' : result.schema.state === 'off' ? 'off' : 'not-evaluated';
  return { successCriteria: criteria, schemaValidation: validate ? schema : undefined };
}

function actionsOf(step: Step, result: StepResult | undefined): LoomAction[] {
  const ran = result !== undefined && result.status !== 'not-run';
  const out: LoomAction[] = [];
  for (const a of step.onSuccess) {
    if (a.type === 'end') out.push({ type: 'end', name: a.name, on: 'success', criteria: criteriaText(a.criteria), taken: ran ? result.flow.kind === 'end' : undefined });
  }
  for (const a of step.onFailure) {
    if (a.type === 'retry') out.push({ type: 'retry', name: a.name, on: 'failure', retryAfter: a.retryAfter, retryLimit: a.retryLimit, applied: ran ? result.attempts.length > 1 : undefined });
    else out.push({ type: 'end', name: a.name, on: 'failure', criteria: criteriaText(a.criteria), taken: ran ? result.flow.kind === 'stop' : undefined });
  }
  return out;
}

/** Everything the Loom needs for a workflow and, optionally, the results of one run. */
export function buildLoomProps(workflow: Workflow, document: ArazzoDocument, run: WorkflowRun | undefined, selectedStep: string | undefined): LoomProps {
  const validate = run?.options.validateSchemas === true;
  const used = [...new Set(workflow.steps.map((s) => s.sourceName))];
  const sources: LoomSource[] = used.map((name) => {
    const src = document.sources.find((s) => s.name === name);
    const linked = src?.link.status === 'linked';
    const protocol: Protocol = src?.link.status === 'linked' ? src.link.protocol : src?.type === 'asyncapi' ? 'EVENT' : 'REST';
    return { name, type: src?.type ?? 'openapi', protocol, linked };
  });
  const steps: LoomStep[] = workflow.steps.map((step) => {
    const result = run?.steps.find((r) => r.stepId === step.stepId);
    return {
      stepId: step.stepId,
      source: step.sourceName,
      operation: `${step.method} ${step.path}`,
      dependsOn: step.dependsOn,
      status: result?.status,
      attempts: result && result.attempts.length > 0 ? result.attempts.length : undefined,
      checks: checksOf(result, validate),
      actions: actionsOf(step, result),
    };
  });
  return {
    sources,
    steps,
    threads: threadsOf(workflow),
    inputs: workflow.inputs.map((i) => i.name),
    outputs: workflow.outputs.map((o) => o.name),
    validatesSchemas: validate,
    selectedStep,
    label: `Loom of ${workflow.workflowId}${run ? `, results of run #${run.number}` : ', definition only'}`,
  };
}

/** The effective dependencies of each step, as the Loom lays them out (sequential unless some step declares dependsOn). */
export function effectiveDependencies(steps: readonly Pick<Step, 'stepId' | 'dependsOn'>[]): string[][] {
  const declared = steps.some((s) => s.dependsOn && s.dependsOn.length > 0);
  return steps.map((s, i) => (declared ? (s.dependsOn ?? []) : i > 0 ? [(steps[i - 1] as Pick<Step, 'stepId'>).stepId] : []));
}

export interface LensUse {
  who: string;
  what: string;
  value: string;
}

export interface Lens {
  expression: string;
  value: string;
  producedBy: string;
  uses: LensUse[];
}

const show = (value: unknown): string => (value === undefined ? 'not resolved' : typeof value === 'string' ? `"${value}"` : JSON.stringify(value));

/** Where a runtime expression is produced and consumed, with its value in the selected run. */
export function lensOf(expression: string, workflow: Pick<Workflow, 'steps' | 'outputs'>, run: WorkflowRun | undefined): Lens {
  const ctx = {
    inputs: run?.options.inputs,
    steps: Object.fromEntries((run?.steps ?? []).map((s) => [s.stepId, { outputs: s.outputs }])),
  };
  const value = run ? resolveExpression(expression, ctx) : undefined;
  const producer = expression.startsWith('$inputs.')
    ? `Workflow input ${expression.slice('$inputs.'.length)}`
    : (() => {
        const m = /^\$steps\.([^.]+)\.outputs\.(.+)$/.exec(expression);
        const step = workflow.steps.find((s) => s.stepId === m?.[1]);
        const idx = step ? workflow.steps.indexOf(step) + 1 : 0;
        return m ? `Step ${idx}, ${m[1]}, output ${m[2]}` : 'Unknown';
      })();
  const uses: LensUse[] = [];
  workflow.steps.forEach((step, i) => {
    for (const p of step.parameters) {
      if (p.value.includes(expression)) uses.push({ who: `Step ${i + 1}, ${step.stepId}`, what: `${p.in} parameter ${p.name}`, value: show(value) });
    }
    if (step.requestBody?.includes(expression)) uses.push({ who: `Step ${i + 1}, ${step.stepId}`, what: 'requestBody', value: show(value) });
  });
  for (const o of workflow.outputs) if (o.expression === expression) uses.push({ who: 'Workflow outputs', what: o.name, value: show(value) });
  return { expression, value: run ? show(value) : 'no run selected', producedBy: producer, uses };
}

/** Label of a run in pickers: "#14 · Implementations". */
export function runPickLabel(run: Pick<WorkflowRun, 'number' | 'origin' | 'target'>): string {
  const how =
    run.origin.kind === 'mock-url' ? 'Mock URL' : run.origin.kind === 'session' ? 'Session' : run.target.kind === 'implementations' ? 'Implementations' : run.target.kind === 'mixed' ? 'Mixed' : 'Mocks';
  return `#${run.number} · ${how}`;
}

export { actionLabel };
