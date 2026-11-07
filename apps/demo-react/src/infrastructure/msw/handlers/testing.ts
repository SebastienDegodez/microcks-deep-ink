/**
 * Mock of the Microcks test API (see `src/infrastructure/http/testing/microcks.ts` for the endpoints and the demo-only
 * extensions, marked "proposition v2 / not in Microcks API"). The handlers delegate to the in-memory testing adapters
 * (their seeds and their state: a run created by `POST /api/tests` is listed and read afterwards) and serialise
 * domain runs into Microcks DTOs.
 */
import { http, HttpResponse, type HttpHandler } from 'msw';
import type { CreateTestInput, TestRun, TestStepResult } from '@/domain/testing';
import {
  testCaseId,
  testCaseIdFromPath,
  type DemoTestTarget,
  type MicrocksRequestResponsePair,
  type MicrocksTestRequest,
  type MicrocksTestResult,
} from '@/infrastructure/http/testing/microcks';
import { FixedClock } from '@/infrastructure/in-memory/shared';
import { createInMemoryTestingAdapters, type TestingAdapters } from '@/infrastructure/in-memory/testing';
import { API } from './api';

/** Microcks pages `GET /api/tests/service/{serviceId}` by 20 by default. */
const DEFAULT_PAGE_SIZE = 20;

/** Consecutive steps of the same operation form one Microcks test case, named like Microcks operations (`GET /pastries`). */
function testCases(run: TestRun): { operationName: string; steps: TestStepResult[] }[] {
  const cases: { operationId: string; operationName: string; steps: TestStepResult[] }[] = [];
  for (const step of run.steps) {
    const current = cases.at(-1);
    if (current?.operationId === step.operationId) {
      current.steps.push(step);
      continue;
    }
    const label = run.operationLabels?.find((o) => o.id === step.operationId);
    cases.push({ operationId: step.operationId, operationName: label ? `${label.method} ${label.path}` : `${step.method} ${step.path}`, steps: [step] });
  }
  return cases;
}

/** Domain run -> Microcks `TestResult` (+ the demo extension). */
export function toMicrocksTestResult(run: TestRun): MicrocksTestResult {
  const stepsPassed = run.steps.filter((s) => s.result === 'passed').length;
  const checksDiffer = stepsPassed !== run.passed || run.steps.length !== run.total;
  return {
    id: run.id,
    version: 1,
    testNumber: Number(run.id) || 0,
    testDate: Date.parse(run.startedAt),
    testedEndpoint: run.endpoint,
    serviceId: run.serviceId,
    elapsedTime: run.durationMs,
    success: run.result === 'passed',
    inProgress: run.result === 'running',
    runnerType: run.runner,
    timeout: run.timeoutMs,
    ...(run.secretName ? { secretRef: { secretId: `secret-${run.secretName}`, name: run.secretName } } : {}),
    testCaseResults: testCases(run).map((c) => ({
      operationName: c.operationName,
      success: c.steps.every((s) => s.result === 'passed'),
      elapsedTime: c.steps.reduce((ms, s) => ms + s.ms, 0),
      testStepResults: c.steps.map((s) => ({
        requestName: s.name,
        success: s.result === 'passed',
        elapsedTime: s.ms,
        ...(s.violations.length ? { message: s.violations.map((v) => v.raw ?? v.message).join('\n') } : {}),
      })),
    })),
    demo: {
      environment: run.environment,
      ...(run.result === 'timeout' ? { timedOut: true } : {}),
      ...(checksDiffer ? { checks: { passed: run.passed, total: run.total } } : {}),
      conformance: run.conformance,
      reason: run.reason,
      operations: run.operations,
      operationLabels: run.operationLabels,
      launchedBy: run.launchedBy,
      contractFile: run.contractFile,
      relatedWorkflowRun: run.relatedWorkflowRun,
      live: run.live,
      steps: run.steps.map((s) => ({
        id: s.id, operationId: s.operationId, method: s.method, path: s.path, violations: s.violations, schemaRef: s.schemaRef, contract: s.contract,
      })),
    },
  };
}

/** Request/response messages of one test case (`GET /api/tests/{id}/messages/{testCaseId}`). */
export function toMicrocksMessages(run: TestRun, caseId: string): MicrocksRequestResponsePair[] {
  const dto = { id: run.id, testNumber: Number(run.id) || 0 };
  const testCase = testCases(run).find((c) => testCaseId(dto, c.operationName) === caseId);
  return (testCase?.steps ?? []).map((s) => ({
    type: 'reqRespPair',
    request: { name: s.name, operationId: s.operationId, testCaseId: caseId, ...(s.requestBody !== undefined ? { content: s.requestBody } : {}) },
    response: {
      name: s.name,
      operationId: s.operationId,
      testCaseId: caseId,
      mediaType: 'application/json',
      ...(s.httpStatus !== undefined ? { status: String(s.httpStatus) } : {}),
      ...(s.payload !== undefined ? { content: JSON.stringify(s.payload) } : {}),
    },
  }));
}

async function fullRuns(adapters: TestingAdapters, ids: readonly string[]): Promise<MicrocksTestResult[]> {
  const runs = await Promise.all(ids.map((id) => adapters.testRuns.get(id)));
  return runs.filter((r): r is TestRun => r !== undefined).map(toMicrocksTestResult);
}

function intParam(url: URL, name: string, fallback: number): number {
  const value = Number(url.searchParams.get(name));
  return url.searchParams.has(name) && Number.isInteger(value) && value >= 0 ? value : fallback;
}

/** Fresh handlers over their own in-memory state (one set for the app, one per contract test). */
export function createTestingHandlers(adapters: TestingAdapters = createInMemoryTestingAdapters({ clock: new FixedClock() })): HttpHandler[] {
  const { testRuns } = adapters;
  return [
    http.get(`${API}/tests/service/:serviceId/count`, async ({ params }) =>
      HttpResponse.json({ counter: (await testRuns.listForService(String(params.serviceId))).length }),
    ),
    http.get(`${API}/tests/service/:serviceId`, async ({ params, request }) => {
      const url = new URL(request.url);
      const page = intParam(url, 'page', 0);
      const size = intParam(url, 'size', DEFAULT_PAGE_SIZE);
      const runs = (await testRuns.listForService(String(params.serviceId))).slice(page * size, (page + 1) * size);
      return HttpResponse.json(await fullRuns(adapters, runs.map((r) => r.id)));
    }),
    // Proposition v2 / not in Microcks API: the most recent runs across services.
    http.get(`${API}/tests`, async ({ request }) => {
      const size = intParam(new URL(request.url), 'size', DEFAULT_PAGE_SIZE);
      return HttpResponse.json(await fullRuns(adapters, (await testRuns.recent(size)).map((r) => r.id)));
    }),
    http.post(`${API}/tests`, async ({ request }) => {
      const body = (await request.json()) as Partial<MicrocksTestRequest> | null;
      if (!body?.serviceId || !body.testEndpoint || !body.runnerType || typeof body.timeout !== 'number') {
        return HttpResponse.json({ message: 'serviceId, testEndpoint, runnerType and timeout are required' }, { status: 400 });
      }
      const target = (await testRuns.targets()).find((t) => t.serviceId === body.serviceId);
      const input: CreateTestInput = {
        serviceId: body.serviceId,
        endpoint: body.testEndpoint,
        runner: body.runnerType,
        timeoutMs: body.timeout,
        ...(body.secretName ? { secretName: body.secretName } : {}),
        ...(body.filteredOperations
          ? { operations: body.filteredOperations.map((name) => target?.operations.find((o) => o.name === name)?.id ?? name) }
          : {}),
        ...(body.operationsHeaders?.globals ? { headers: body.operationsHeaders.globals.map((h) => ({ name: h.name, value: h.values })) } : {}),
      };
      return HttpResponse.json(toMicrocksTestResult(await testRuns.create(input)), { status: 201 });
    }),
    http.get(`${API}/tests/:id/messages/:testCaseId`, async ({ params, request }) => {
      const run = await testRuns.get(String(params.id));
      // Read from the raw path: the id is URL-encoded once by the client, `/` replaced by `!`.
      const caseId = testCaseIdFromPath(new URL(request.url).pathname.split('/').at(-1) ?? '');
      return HttpResponse.json(run ? toMicrocksMessages(run, caseId) : []);
    }),
    http.get(`${API}/tests/:id`, async ({ params }) => {
      const run = await testRuns.get(String(params.id));
      // Like Microcks: an unknown id answers 200 with an empty body.
      return run ? HttpResponse.json(toMicrocksTestResult(run)) : new HttpResponse(null, { status: 200 });
    }),
    // Proposition v2 / not in Microcks API: what each service offers to the "Run a test" form.
    http.get(`${API}/test-targets`, async () => {
      const targets = await testRuns.targets();
      const dtos: DemoTestTarget[] = await Promise.all(
        targets.map(async (t) => {
          const latest = (await testRuns.listForService(t.serviceId, { limit: 1 }))[0];
          return latest
            ? { ...t, latestTest: { id: latest.id, testDate: Date.parse(latest.startedAt), serviceId: latest.serviceId, success: latest.result === 'passed' } }
            : t;
        }),
      );
      return HttpResponse.json(dtos);
    }),
  ];
}
