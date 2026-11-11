import { baggage } from './baggage.js';
import { criteriaText } from './describe.js';
import { evaluateCriterion, resolveExpression, type EvaluationContext } from './expression.js';
import { playWorkflow, type PlayedAttempt, type PlayedStep, type Responder, type StepResponse } from './execution.js';
import type {
  MockCoherenceIssue,
  RunOptions,
  RunOrigin,
  RunTarget,
  StepAttempt,
  StepResult,
  WorkflowRun,
} from './run.js';
import type { Step, Workflow } from './workflow.js';

/** What a simulated target answers: a `StepResponse` plus what the run detail needs to explain it. */
export interface SimulatedResponse extends StepResponse {
  /** Key of the body that breaks the schema; its line is marked in the response block. */
  badKey?: string;
  /** Short note written next to the bad line, e.g. "schema: number". */
  badNote?: string;
  /** Schema reference and message shown with a schema failure. */
  schemaRef?: string;
  schemaMessage?: string;
  /** The mock has no example for this call (a mock coherence issue). */
  missingExample?: { description: string; hint: string };
}

export type SimulatedResponder = (step: Step, attempt: number, ctx: EvaluationContext) => SimulatedResponse;

export interface SimulateRunInput {
  runId: string;
  number: number;
  workflow: Pick<Workflow, 'workflowId' | 'documentId' | 'steps' | 'outputs'>;
  origin: RunOrigin;
  target: RunTarget;
  options: RunOptions;
  startedAt: string;
  respond: SimulatedResponder;
  /** Base URL of a source for this run (the mocks, or the implementation). */
  baseUrl: (sourceName: string) => string;
}

const REASON: Record<number, string> = {
  200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 401: 'Unauthorized', 404: 'Not Found',
  409: 'Conflict', 500: 'Internal Server Error', 502: 'Bad Gateway', 504: 'Gateway Timeout',
};

const show = (value: unknown): string => (typeof value === 'string' ? value : JSON.stringify(value));

/** Replaces `"{$inputs.x}"` in a request body template with the JSON value of the expression. */
export function renderBody(template: string, ctx: EvaluationContext): string {
  return template.replace(/"\{(\$[^}]+)\}"/g, (_m, expr: string) => {
    const value = resolveExpression(expr, ctx);
    return value === undefined ? 'null' : JSON.stringify(value);
  });
}

function requestOf(step: Step, ctx: EvaluationContext, baseUrl: string): NonNullable<StepResult['request']> {
  const params: Record<string, string> = {};
  let path = step.path;
  const query: string[] = [];
  for (const p of step.parameters) {
    const value = resolveExpression(p.value, ctx);
    const text = value === undefined ? '' : show(value);
    params[p.name] = text;
    if (p.in === 'path') path = path.replace(`{${p.name}}`, encodeURIComponent(text));
    else if (p.in === 'query') query.push(`${encodeURIComponent(p.name)}=${encodeURIComponent(text)}`);
  }
  return {
    method: step.method,
    url: `${baseUrl}${path}${query.length ? `?${query.join('&')}` : ''}`,
    params,
    body: step.requestBody ? renderBody(step.requestBody, ctx) : undefined,
  };
}

function linesOf(response: SimulatedResponse): NonNullable<StepResult['response']>['lines'] {
  if (response.body === undefined || response.body === '') return [];
  return JSON.stringify(response.body, null, 2)
    .split('\n')
    .map((text) => {
      const bad = response.badKey !== undefined && text.trimStart().startsWith(`"${response.badKey}":`);
      return bad ? { text, bad: true, note: response.badNote ?? 'schema mismatch' } : { text };
    });
}

function flowOf(step: Step, played: PlayedStep, retryAfter: number | undefined): StepResult['flow'] {
  const attempts = played.attempts.length;
  const flow = played.flow;
  if (played.status === 'not-run') return { kind: 'next', title: '', text: '' };
  if (flow.kind === 'next') {
    return { kind: 'next', title: 'Next step', text: 'The step passed, so the run continues with the next step.' };
  }
  if (flow.kind === 'end' && flow.outcome === 'success') {
    const action = step.onSuccess.find((a) => a.name === flow.actionName);
    const when = criteriaText(action?.criteria);
    return {
      kind: 'end',
      title: 'onSuccess end applies: the run ends here',
      text: `${when ? `Its criterion ${when} holds` : 'The end action applies'}: nothing more to do. The run ends with SUCCESS; the later steps are not run.`,
    };
  }
  if (flow.kind === 'end' && flow.reason === 'retry-limit-reached') {
    return {
      kind: 'stop',
      title: `Failed after ${attempts} attempts: the run ends here`,
      text: `Each attempt failed, so onFailure retry applied ${attempts - 1} ${attempts - 1 === 1 ? 'time' : 'times'} (retryAfter ${retryAfter ?? 0} s, retryLimit ${attempts - 1}). After attempt ${attempts} the retry limit is reached: the run ends with FAILURE and the later steps are not run.`,
    };
  }
  return {
    kind: 'stop',
    title: 'No onFailure action: the run ends here',
    text: `${step.stepId} declares no onFailure action, so the run ends with FAILURE. The later steps are not run.`,
  };
}

/**
 * Plays a workflow with `playWorkflow` and turns the outcome into a full `WorkflowRun`: requests with
 * resolved expressions, responses with the bad line marked, criteria evaluations, schema validation,
 * attempts, flow notes, W3C baggage and mock coherence issues. Pure: the "world" is the `respond` argument.
 */
export function simulateRun(input: SimulateRunInput): WorkflowRun {
  const { workflow, options, runId } = input;
  const recorded = new Map<string, { response: SimulatedResponse; ctx: EvaluationContext }>();
  const key = (stepId: string, attempt: number) => `${stepId}#${attempt}`;

  const respond: Responder = (step, attempt, ctx) => {
    const response = input.respond(step, attempt, ctx);
    recorded.set(key(step.stepId, attempt), { response, ctx });
    return response;
  };
  const played = playWorkflow(workflow, respond, { inputs: options.inputs, validateSchemas: options.validateSchemas });
  const byId = new Map(played.steps.map((p) => [p.stepId, p]));

  const coherence: MockCoherenceIssue[] = [];
  const steps: StepResult[] = workflow.steps.map((step) => {
    const p = byId.get(step.stepId) as PlayedStep;
    const retry = step.onFailure.find((a) => a.type === 'retry');
    const retryAfter = retry && retry.type === 'retry' ? retry.retryAfter : undefined;
    const attempts: StepAttempt[] = p.attempts.map((a: PlayedAttempt) => ({
      n: a.n,
      httpStatus: a.statusCode,
      ms: a.ms,
      when: a.n === 1 ? 'first call' : `after ${retryAfter ?? 0} s`,
      ...(a.n > 1 ? { waitMs: (retryAfter ?? 0) * 1000 } : {}),
    }));
    if (p.status === 'not-run' || attempts.length === 0) {
      return {
        stepId: step.stepId,
        status: 'not-run',
        attempts: [],
        criteria: [],
        schema: { state: 'off', ref: '', message: 'Not run.' },
        outputs: {},
        flow: { kind: 'next', title: '', text: '' },
        baggage: baggage(runId, workflow.workflowId, step.stepId, 1),
      };
    }
    const last = recorded.get(key(step.stepId, p.attempts.length)) as { response: SimulatedResponse; ctx: EvaluationContext };
    const { response } = last;
    const evalCtx: EvaluationContext = { ...last.ctx, statusCode: response.statusCode, body: response.body, headers: response.headers };
    const lastAttempt = p.attempts[p.attempts.length - 1] as PlayedAttempt;
    const schema: StepResult['schema'] = !options.validateSchemas
      ? { state: 'off', ref: '', message: 'Off for this run: the step is judged on its success criteria only.' }
      : response.schema === 'fail'
        ? {
            state: 'fail',
            ref: response.schemaRef ?? `${step.operationId} · ${response.statusCode} · application/json`,
            message: response.schemaMessage ?? 'The response does not conform to its schema.',
          }
        : response.schema === 'pass'
          ? { state: 'pass', ref: `${step.operationId} · ${response.statusCode} · application/json`, message: 'The response conforms to its schema.' }
          : { state: 'na', ref: '', message: 'No schema to validate this response against.' };
    if (response.missingExample && lastAttempt.passed === false) {
      coherence.push({
        stepId: step.stepId,
        operationId: step.operationId,
        missing: response.missingExample.description,
        copilotHint: response.missingExample.hint,
      });
    }
    return {
      stepId: step.stepId,
      status: p.status,
      attempts,
      request: requestOf(step, last.ctx, input.baseUrl(step.sourceName)),
      response: {
        meta: `${response.statusCode} ${REASON[response.statusCode] ?? ''}${response.body === undefined ? '' : ' · application/json'}`.trim(),
        lines: linesOf(response),
      },
      criteria: step.successCriteria.map((c) => {
        const result = evaluateCriterion(c, evalCtx);
        return { condition: c.condition, kind: result.kind, evaluation: result.evaluation, held: result.held };
      }),
      schema,
      outputs: p.outputs,
      flow: flowOf(step, p, retryAfter),
      baggage: baggage(runId, workflow.workflowId, step.stepId, attempts.length),
    };
  });

  return {
    id: runId,
    number: input.number,
    documentId: workflow.documentId,
    workflowId: workflow.workflowId,
    origin: input.origin,
    target: input.target,
    options,
    status: played.status,
    startedAt: input.startedAt,
    steps,
    outputs: played.outputs,
    coherence,
  };
}
