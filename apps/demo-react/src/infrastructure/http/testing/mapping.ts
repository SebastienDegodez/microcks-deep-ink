/** Microcks DTOs (`./microcks.ts`) -> testing domain. Pure functions, unit-tested in `mapping.test.ts`. */
import type { TestResult, TestRun, TestRunSummary, TestStepResult, TestTarget } from '@/domain/testing';
import { formatRelative } from '@/domain/shared';
import {
  testCaseId,
  toIsoDate,
  type DemoTestTarget,
  type MicrocksRequestResponsePair,
  type MicrocksTestCaseResult,
  type MicrocksTestResult,
  type MicrocksTestStepResult,
} from './microcks';

/** Messages of a run, keyed by Microcks test case id (`GET /tests/{id}/messages/{testCaseId}`). */
export type MessagesByTestCase = ReadonlyMap<string, readonly MicrocksRequestResponsePair[]>;

function definedOnly<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

function resultOf(dto: MicrocksTestResult): TestResult {
  if (dto.inProgress) return 'running';
  if (dto.success) return 'passed';
  return dto.demo?.timedOut ? 'timeout' : 'failed';
}

function flatSteps(dto: MicrocksTestResult): { testCase: MicrocksTestCaseResult; step: MicrocksTestStepResult }[] {
  return (dto.testCaseResults ?? []).flatMap((testCase) => (testCase.testStepResults ?? []).map((step) => ({ testCase, step })));
}

export function toTestRunSummary(dto: MicrocksTestResult): TestRunSummary {
  const steps = flatSteps(dto);
  const demo = dto.demo;
  return definedOnly<TestRunSummary>({
    id: dto.id,
    serviceId: dto.serviceId,
    runner: dto.runnerType,
    environment: demo?.environment ?? 'staging',
    endpoint: dto.testedEndpoint,
    result: resultOf(dto),
    startedAt: toIsoDate(dto.testDate),
    durationMs: dto.elapsedTime ?? 0,
    passed: demo?.checks?.passed ?? steps.filter(({ step }) => step.success).length,
    total: demo?.checks?.total ?? steps.length,
    conformance: demo?.conformance,
    reason: demo?.reason,
    operations: demo?.operations,
  });
}

function parseContent(content: string | undefined): unknown {
  if (content === undefined || content === '') return undefined;
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

/** `TestResult` + its messages -> the run with its steps. Steps without a message pair keep no payload. */
export function toTestRun(dto: MicrocksTestResult, messages: MessagesByTestCase = new Map()): TestRun {
  const demo = dto.demo;
  const steps = flatSteps(dto).map(({ testCase, step }, index): TestStepResult => {
    const ext = demo?.steps?.[index];
    const [verb = '', ...rest] = testCase.operationName.split(' ');
    const pair = messages.get(testCaseId(dto, testCase.operationName))?.find((p) => p.request.name === step.requestName);
    return definedOnly<TestStepResult>({
      id: ext?.id ?? `s${index + 1}`,
      operationId: ext?.operationId ?? testCase.operationName,
      name: step.requestName ?? step.eventMessageName ?? '',
      method: ext?.method ?? verb,
      path: ext?.path ?? rest.join(' '),
      ms: step.elapsedTime,
      result: step.success ? 'passed' : 'failed',
      violations: ext?.violations ?? (step.message ? [{ path: '$', message: step.message }] : []),
      httpStatus: pair?.response.status ? Number(pair.response.status) : undefined,
      requestBody: pair?.request.content || undefined,
      payload: parseContent(pair?.response.content),
      schemaRef: ext?.schemaRef,
      contract: ext?.contract,
    });
  });
  return definedOnly<TestRun>({
    ...toTestRunSummary(dto),
    timeoutMs: dto.timeout ?? 0,
    secretName: dto.secretRef?.name,
    steps,
    live: demo?.live,
    operationLabels: demo?.operationLabels,
    launchedBy: demo?.launchedBy,
    contractFile: demo?.contractFile,
    relatedWorkflowRun: demo?.relatedWorkflowRun,
  });
}

/** Demo target -> domain target; "last test" is the latest run, relative to `now`. */
export function toTestTarget(dto: DemoTestTarget, now: Date): TestTarget {
  const { latestTest, ...target } = dto;
  if (!latestTest) return target;
  const result = latestTest.success ? 'passed' : 'failed';
  return { ...target, lastTest: { ok: latestTest.success, text: `${result} · ${formatRelative(now, toIsoDate(latestTest.testDate))}` } };
}
