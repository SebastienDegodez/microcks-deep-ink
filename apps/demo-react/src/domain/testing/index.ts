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
  violations: { path: string; message: string }[];
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
}

export interface TestRun extends TestRunSummary {
  timeoutMs: number;
  secretName?: string;
  steps: TestStepResult[];
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
