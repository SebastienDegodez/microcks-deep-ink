/**
 * HTTP adapters of the testing feature, over the Microcks test API (see `./microcks.ts` for the endpoints and the
 * demo-only extensions).
 *
 * Live runs (`watch`): Microcks has no stream for a running test (its UI polls `GET /api/tests/{id}` until
 * `inProgress` is false) and the demo's runs are complete as soon as they are created, so polling would give a single
 * final snapshot. `watch` fetches the run once and replays its steps on the client, one per tick (1200 ms), exactly
 * like the in-memory adapter: the stream stays in memory behind the port, no non-Microcks SSE endpoint is invented.
 */
import { filterRuns, type CreateTestInput, type TestRun } from '@/domain/testing';
import type { TestRunFilter, TestRunRepository } from '@/application/ports/testing';
import type { Clock } from '@/application/ports/shared';
import { NotFoundError } from '@/application/shared';
import type { HttpClient } from '@/infrastructure/http/client';
import { createSequenceStream } from '@/infrastructure/in-memory/shared/stream';
import { toTestRun, toTestRunSummary, toTestTarget, type MessagesByTestCase } from './mapping';
import {
  testCaseId,
  testCaseIdToPath,
  type DemoTestTarget,
  type MicrocksCounter,
  type MicrocksRequestResponsePair,
  type MicrocksTestRequest,
  type MicrocksTestResult,
} from './microcks';

export interface HttpTestingDeps {
  http: HttpClient;
  clock: Clock;
}

export interface HttpTestingAdapters {
  testRuns: TestRunRepository;
}

export function createHttpTestingAdapters({ http, clock }: HttpTestingDeps): HttpTestingAdapters {
  const service = (serviceId: string) => `tests/service/${encodeURIComponent(serviceId)}`;

  async function fetchRun(id: string): Promise<MicrocksTestResult | undefined> {
    try {
      // Microcks answers an unknown id with 200 and an empty body.
      return (await http.get<MicrocksTestResult | null | undefined>(`tests/${encodeURIComponent(id)}`)) ?? undefined;
    } catch (error) {
      if (error instanceof NotFoundError) return undefined;
      throw error;
    }
  }

  async function withMessages(dto: MicrocksTestResult): Promise<TestRun> {
    const cases = dto.testCaseResults ?? [];
    const entries = await Promise.all(
      cases.map(async (c) => {
        const caseId = testCaseId(dto, c.operationName);
        const pairs = await http.get<MicrocksRequestResponsePair[]>(`tests/${encodeURIComponent(dto.id)}/messages/${testCaseIdToPath(caseId)}`);
        return [caseId, pairs ?? []] as const;
      }),
    );
    const messages: MessagesByTestCase = new Map(entries);
    return toTestRun(dto, messages);
  }

  async function get(id: string): Promise<TestRun | undefined> {
    const dto = await fetchRun(id);
    return dto ? withMessages(dto) : undefined;
  }

  async function operationNames(serviceId: string, ids: readonly string[]): Promise<string[]> {
    const targets = await http.get<DemoTestTarget[]>('test-targets');
    const operations = targets.find((t) => t.serviceId === serviceId)?.operations ?? [];
    return ids.map((id) => operations.find((o) => o.id === id)?.name ?? id);
  }

  const testRuns: TestRunRepository = {
    async listForService(serviceId, filter: TestRunFilter = {}) {
      const filtered = [filter.result, filter.runner, filter.environment].some((f) => f !== undefined && f !== 'all');
      let size = filter.limit;
      if (filtered || size === undefined) size = (await http.get<MicrocksCounter>(`${service(serviceId)}/count`)).counter;
      if (size === 0) return [];
      const dtos = await http.get<MicrocksTestResult[]>(service(serviceId), { query: { page: 0, size } });
      // Microcks filters by service only: result, runner and environment are applied here.
      // Microcks filters by service only: result, runner and environment are applied here.
      const runs = filterRuns(dtos.map(toTestRunSummary), filter);
      return filter.limit ? runs.slice(0, filter.limit) : runs;
    },
    async recent(limit) {
      return (await http.get<MicrocksTestResult[]>('tests', { query: { size: limit } })).map(toTestRunSummary);
    },
    get,
    async create(input: CreateTestInput) {
      const request: MicrocksTestRequest = {
        serviceId: input.serviceId,
        testEndpoint: input.endpoint,
        runnerType: input.runner,
        timeout: input.timeoutMs,
        ...(input.operations ? { filteredOperations: await operationNames(input.serviceId, input.operations) } : {}),
        ...(input.secretName ? { secretName: input.secretName } : {}),
        ...(input.headers?.length ? { operationsHeaders: { globals: input.headers.map((h) => ({ name: h.name, values: h.value })) } } : {}),
      };
      const created = await http.post<MicrocksTestResult>('tests', request);
      return withMessages(created);
    },
    watch(id) {
      return (listener) => {
        let stop: (() => void) | undefined;
        let cancelled = false;
        get(id).then(
          (run) => {
            if (cancelled || !run) return;
            const snapshots: TestRun[] = run.steps.map((_, i) => {
              const steps = run.steps.slice(0, i + 1);
              const last = i === run.steps.length - 1;
              return { ...run, steps, passed: steps.filter((s) => s.result === 'passed').length, total: run.steps.length, result: last ? run.result : 'running' };
            });
            stop = createSequenceStream(snapshots)(listener);
          },
          () => undefined,
        );
        return () => {
          cancelled = true;
          stop?.();
        };
      };
    },
    async targets() {
      const now = clock.now();
      return (await http.get<DemoTestTarget[]>('test-targets')).map((t) => toTestTarget(t, now));
    },
  };
  return { testRuns };
}
