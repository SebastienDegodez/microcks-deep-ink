export type RunTarget =
  | { kind: 'mocks' }
  | { kind: 'implementations'; baseUrls: Record<string, string> }
  /** Proposed, beyond the POC. */
  | { kind: 'mixed'; perSource: Record<string, 'mock' | 'implementation'>; proposed: true };

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
