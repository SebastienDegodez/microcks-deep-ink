/**
 * Wire format of the testing API: the Microcks REST API v1.15 (https://github.com/microcks/microcks/blob/master/api/microcks-openapi-v1.15.yaml)
 * plus the demo extensions marked "proposition v2 / not in Microcks API".
 *
 * Microcks endpoints used:
 * - `GET  /api/tests/service/{serviceId}?page&size` -> `TestResult[]` (newest first, Microcks pages by 20 by default)
 * - `GET  /api/tests/service/{serviceId}/count`     -> `Counter`
 * - `GET  /api/tests/{id}`                           -> `TestResult` (Microcks answers 200 with an empty body when unknown)
 * - `POST /api/tests` (`TestRequest`)                -> 201 `TestResult`
 * - `GET  /api/tests/{id}/messages/{testCaseId}`     -> `RequestResponsePair[]`
 *
 * Demo-only (proposition v2 / not in Microcks API):
 * - `GET /api/tests?size=N`  -> `TestResult[]`, the most recent runs across services (Cockpit).
 * - `GET /api/test-targets`  -> `DemoTestTarget[]`, what each service offers to the "Run a test" form.
 * - the `demo` member of `TestResult` (fields of the demo's test runs Microcks does not store) and the
 *   `A2A_CONFORMANCE` runner type.
 */
import type { ContractProperty, OperationOutcome, TestEnvironment, TestRunner, TestTarget, TestViolation } from '@/domain/testing';

/** Microcks `TestRunnerType` (`A2A_CONFORMANCE` is a demo extension). */
export type MicrocksTestRunnerType = TestRunner;

/** Microcks `TestStepResult`. */
export interface MicrocksTestStepResult {
  success: boolean;
  elapsedTime: number;
  requestName?: string;
  message?: string;
  eventMessageName?: string;
}

/** Microcks `TestCaseResult`: one per operation. */
export interface MicrocksTestCaseResult {
  success: boolean;
  elapsedTime: number;
  operationName: string;
  testStepResults?: MicrocksTestStepResult[];
}

/** Microcks `HeaderDTO` (values are comma separated). */
export interface MicrocksHeaderDto {
  name: string;
  values: string;
}

/** Microcks `OperationHeaders`: keys are operation names or `globals`. */
export type MicrocksOperationHeaders = Record<string, MicrocksHeaderDto[]>;

/** Microcks `TestResult`. */
export interface MicrocksTestResult {
  id: string;
  version: number;
  testNumber: number;
  /** Epoch milliseconds. */
  testDate: number;
  testedEndpoint: string;
  serviceId: string;
  elapsedTime?: number;
  success: boolean;
  inProgress: boolean;
  runnerType: MicrocksTestRunnerType;
  testCaseResults?: MicrocksTestCaseResult[];
  secretRef?: { secretId: string; name: string };
  operationHeaders?: MicrocksOperationHeaders;
  timeout?: number;
  /** Proposition v2 / not in Microcks API. */
  demo?: DemoTestResultExtension;
}

/** Proposition v2 / not in Microcks API: what the demo shows about a run that Microcks does not store. */
export interface DemoTestResultExtension {
  environment: TestEnvironment;
  /** The run ended on its timeout (Microcks only says `success: false`). */
  timedOut?: boolean;
  /** Passed/total checks when they are not the step counts (A2A conformance counts checks, not requests). */
  checks?: { passed: number; total: number };
  conformance?: number;
  reason?: string;
  operations?: OperationOutcome[];
  operationLabels?: { id: string; method: string; path: string }[];
  launchedBy?: string;
  contractFile?: string;
  relatedWorkflowRun?: { runId: string; number: number; workflowTitle: string; stepId: string };
  live?: boolean;
  /** One entry per `testStepResults` item, in order (test cases flattened). */
  steps?: DemoTestStepExtension[];
}

/** Proposition v2 / not in Microcks API: structured validation results of a step (Microcks has a `message` string). */
export interface DemoTestStepExtension {
  id: string;
  operationId: string;
  method: string;
  path: string;
  violations: TestViolation[];
  schemaRef?: string;
  contract?: ContractProperty[];
}

/** Microcks `TestRequest`. */
export interface MicrocksTestRequest {
  serviceId: string;
  testEndpoint: string;
  runnerType: MicrocksTestRunnerType;
  timeout: number;
  /** Operation names (`GET /pastries`). */
  filteredOperations?: string[];
  secretName?: string;
  operationsHeaders?: MicrocksOperationHeaders;
}

/** Microcks `Counter`. */
export interface MicrocksCounter {
  counter: number;
}

/** Microcks `Message` (common part of `Request` and `Response`). */
export interface MicrocksMessage {
  name: string;
  operationId: string;
  testCaseId?: string;
  content?: string;
}

/** Microcks `RequestResponsePair`. */
export interface MicrocksRequestResponsePair {
  type: 'reqRespPair';
  request: MicrocksMessage;
  response: MicrocksMessage & { status?: string; mediaType?: string };
}

/** Microcks `TestResultSummary`. */
export interface MicrocksTestResultSummary {
  id: string;
  testDate: number;
  serviceId: string;
  success: boolean;
}

/** Proposition v2 / not in Microcks API: a service's offer to the "Run a test" form, with its latest run. */
export interface DemoTestTarget extends Omit<TestTarget, 'lastTest'> {
  /** Shown when the service has no run. */
  lastTest: TestTarget['lastTest'];
  latestTest?: MicrocksTestResultSummary;
}

/**
 * Microcks test case id: `<testResultId>-<testNumber>-<operationName>` (`IdBuilder.buildTestCaseId`). In a URL the
 * `/` of the operation name become `!` and the whole id is URL-encoded (`TestController.getMessagesForTestCase`).
 */
export function testCaseId(result: Pick<MicrocksTestResult, 'id' | 'testNumber'>, operationName: string): string {
  return `${result.id}-${result.testNumber}-${operationName}`;
}

export function testCaseIdToPath(id: string): string {
  return encodeURIComponent(id.replaceAll('/', '!'));
}

export function testCaseIdFromPath(segment: string): string {
  return decodeURIComponent(segment).replaceAll('!', '/');
}

/** Epoch milliseconds -> the demo's ISO dates (`2026-11-03T09:10:04Z`, no milliseconds when they are zero). */
export function toIsoDate(epochMs: number): string {
  return new Date(epochMs).toISOString().replace(/\.000Z$/, 'Z');
}
