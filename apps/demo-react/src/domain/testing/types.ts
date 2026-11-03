export type TestRunner =
  | 'HTTP'
  | 'SOAP_HTTP'
  | 'SOAP_UI'
  | 'POSTMAN'
  | 'OPEN_API_SCHEMA'
  | 'ASYNC_API_SCHEMA'
  | 'GRPC_PROTOBUF'
  | 'GRAPHQL_SCHEMA';

export type TestResult = 'passed' | 'failed' | 'timeout' | 'running';

export type TestEnvironment = 'staging' | 'prod' | 'local';

/** Outcome of one operation over a run: passed, failed, or no result (timeout before it answered). */
export type OperationOutcome = 'pass' | 'fail' | 'none';

export interface TestViolation {
  /** JSON path, e.g. `$.price`. */
  path: string;
  message: string;
  /** Raw validator message, shown in the "raw message" disclosure. */
  raw?: string;
}

/** One property of the contract schema, aligned row by row with the actual response. */
export interface ContractProperty {
  key: string;
  /** Schema fragment, e.g. `{ type: number }`. */
  schema: string;
}

/** One call of a test run: an operation example played against the endpoint. */
export interface TestStepResult {
  id: string;
  operationId: string;
  name: string;
  method: string;
  path: string;
  ms: number;
  result: 'passed' | 'failed';
  /** JSON-path like violations, e.g. `$.price` string where a number is expected. */
  violations: TestViolation[];
  httpStatus?: number;
  /** JSON body sent (PATCH). */
  requestBody?: string;
  /** Actual JSON response: an object, or an array of objects. */
  payload?: unknown;
  /** e.g. `#/components/schemas/Pastry`. */
  schemaRef?: string;
  contract?: ContractProperty[];
}

export interface TestRunSummary {
  id: string;
  serviceId: string;
  runner: TestRunner;
  environment: TestEnvironment;
  endpoint: string;
  result: TestResult;
  startedAt: string;
  durationMs: number;
  /** Passed steps over total steps. */
  passed: number;
  total: number;
  reason?: string;
  /** One outcome per operation of the service, in operation order. */
  operations?: OperationOutcome[];
}

export interface TestRun extends TestRunSummary {
  timeoutMs: number;
  secretName?: string;
  steps: TestStepResult[];
  /** True for a run that "executes" when the page opens (streams its steps). */
  live?: boolean;
  /** Operations of the service, in order, to group the steps. */
  operationLabels?: { id: string; method: string; path: string }[];
  launchedBy?: string;
  /** The workflow run that hits the same contract violation (Arazzo run #14 for test run #119). */
  relatedWorkflowRun?: { runId: string; number: number; workflowTitle: string; stepId: string };
}

export interface CreateTestInput {
  serviceId: string;
  endpoint: string;
  runner: TestRunner;
  timeoutMs: number;
  secretName?: string;
  operations?: string[];
  headers?: { name: string; value: string }[];
}

/** What a service offers to the "Run a test" form. */
export type TestTargetType = 'REST' | 'EVENT' | 'GRPC' | 'GRAPHQL' | 'SOAP_HTTP';

export interface TestTargetOperation {
  id: string;
  verb: string;
  name: string;
  path: string;
  samples: number;
}

export interface TestTarget {
  serviceId: string;
  type: TestTargetType;
  /** Contract artifacts, e.g. "OpenAPI 3.0.2 + Postman collection". */
  artifacts: string;
  lastTest: { ok: boolean | null; text: string };
  endpoint: string;
  endpointHelp: string;
  runners: { id: TestRunner; recommended?: boolean; unavailableReason?: string }[];
  operations: TestTargetOperation[];
  recentEndpoints: { env: TestEnvironment; url: string }[];
}

/** Conformance score of a run: passed steps over total, rounded. */
export function runConformance(run: Pick<TestRunSummary, 'passed' | 'total'>): number {
  return run.total === 0 ? 0 : Math.round((100 * run.passed) / run.total);
}

/** Applies the Tests-page filters. `result: 'failed'` includes timeouts. */
export function filterRuns<T extends TestRunSummary>(
  runs: readonly T[],
  filter: { result?: 'all' | 'passed' | 'failed'; runner?: string; environment?: string },
): T[] {
  return runs.filter(
    (r) =>
      (!filter.result || filter.result === 'all' || (filter.result === 'passed' ? r.result === 'passed' : r.result !== 'passed')) &&
      (!filter.runner || filter.runner === 'all' || r.runner === filter.runner) &&
      (!filter.environment || filter.environment === 'all' || r.environment === filter.environment),
  );
}

export function operationLabel(op: { method: string; path: string }): string {
  return `${op.method} ${op.path}`;
}
