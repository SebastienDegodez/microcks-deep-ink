export type RunTarget =
  | { kind: 'mocks' }
  | { kind: 'implementations'; baseUrls: Record<string, string> }
  /** Each source on its mocks or its implementation; `baseUrls` holds the URL of the sources on their implementation. */
  | { kind: 'mixed'; perSource: Record<string, 'mock' | 'implementation'>; baseUrls?: Record<string, string> };

/** The base URL of every source a run sends to its implementation (none for the mocks). */
export function implementationUrls(target: RunTarget): Record<string, string> {
  if (target.kind === 'mocks') return {};
  if (target.kind === 'implementations') return target.baseUrls;
  const urls = target.baseUrls ?? {};
  return Object.fromEntries(Object.entries(urls).filter(([source]) => target.perSource[source] === 'implementation'));
}

/** What a launch says of its target (Microcks 2.0): `implementations` for the sources on their implementation, plus `target` for a mixed run. */
export function launchTargetFields(target: RunTarget): { implementations?: Record<string, string>; target?: { kind: 'mixed'; perSource: Record<string, 'mock' | 'implementation'> } } {
  const urls = implementationUrls(target);
  return {
    ...(Object.keys(urls).length > 0 ? { implementations: urls } : {}),
    ...(target.kind === 'mixed' ? { target: { kind: 'mixed' as const, perSource: target.perSource } } : {}),
  };
}

/** Whether at least one source goes to its implementation: only then does the secret authenticate anything. */
export const callsImplementation = (target: RunTarget): boolean =>
  target.kind === 'implementations' || (target.kind === 'mixed' && Object.values(target.perSource).includes('implementation'));

export type RunOrigin =
  | { kind: 'ui' }
  | { kind: 'api' }
  | { kind: 'mock-url' }
  | { kind: 'session'; sessionId: string; app: string };

export interface RunOptions {
  /** Name of the recorded example played on the mocks. */
  example?: string;
  inputs: Record<string, unknown>;
  /** Secret name used for the implementations. */
  secret?: string;
  timeoutMs: number;
  /** Validate each response against its OpenAPI schema. Default `true`. */
  validateSchemas: boolean;
}

export const DEFAULT_RUN_TIMEOUT_MS = 10_000;

export type RunStatus = 'RUNNING' | 'SUCCESS' | 'FAILURE';
export type StepStatus = 'passed' | 'failed' | 'not-run';
export type SchemaState = 'pass' | 'fail' | 'off' | 'na';

export interface StepAttempt {
  n: number;
  httpStatus: number;
  ms: number;
  when: string;
  /** Time waited before this attempt (the `retryAfter` of an onFailure retry), in ms. */
  waitMs?: number;
}

export interface StepResult {
  stepId: string;
  status: StepStatus;
  attempts: StepAttempt[];
  request?: { method: string; url: string; params: Record<string, string>; body?: string };
  response?: { meta: string; lines: { text: string; bad?: boolean; note?: string }[] };
  criteria: { condition: string; kind: 'simple' | 'regex'; evaluation: string; held: boolean }[];
  schema: { state: SchemaState; ref: string; message: string };
  outputs: Record<string, unknown>;
  /** What happens after this step, in words (for the "flow note"). */
  flow: { kind: 'next' | 'end' | 'stop'; title: string; text: string };
  /** W3C baggage sent with the calls of this step (see `baggage()`). */
  baggage: string;
}

/** A mock example the run needed and did not find. */
export interface MockCoherenceIssue {
  stepId: string;
  operationId: string;
  /** e.g. "an example of GetPastryByName for name=Tarte Tatin" */
  missing: string;
  copilotHint: string;
}

export interface WorkflowRun {
  id: string;
  /** Run number (#14). */
  number: number;
  documentId: string;
  workflowId: string;
  origin: RunOrigin;
  target: RunTarget;
  options: RunOptions;
  status: RunStatus;
  startedAt: string;
  steps: StepResult[];
  outputs: Record<string, unknown>;
  coherence: MockCoherenceIssue[];
  relatedTestRunId?: string;
  /**
   * Only on the intermediate frames of a RUNNING run: the step being called and its attempt number
   * (an attempt above 1 means the step is being retried).
   */
  current?: { stepId: string; attempt: number };
}
