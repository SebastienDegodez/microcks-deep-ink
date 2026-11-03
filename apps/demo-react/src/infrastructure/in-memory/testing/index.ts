import type { CreateTestInput, TestRun, TestRunSummary, TestStepResult } from '@/domain/testing';
import type { TestRunFilter, TestRunRepository } from '@/application/ports/testing';
import { NotFoundError } from '@/application/shared';
import { STAGING_BASE, after, createSequenceStream, type InMemoryDeps } from '../shared';

export interface TestingAdapters {
  testRuns: TestRunRepository;
}

const step = (n: number, operationId: string, name: string, method: string, path: string, ms: number, violations: TestStepResult['violations'] = []): TestStepResult => ({
  id: `s${n}`, operationId, name, method, path, ms, result: violations.length ? 'failed' : 'passed', violations,
});

/** The 7 steps of test run #119 (TestRun prototype): the last one fails on `price` (and the status enum). */
const STEPS_119: TestStepResult[] = [
  step(1, 'get-list', 'Size S', 'GET', '/pastries?size=S', 38),
  step(2, 'get-list', 'Size M', 'GET', '/pastries?size=M', 41),
  step(3, 'get-list', 'Size L', 'GET', '/pastries?size=L', 35),
  step(4, 'get-name', 'Millefeuille', 'GET', '/pastries/Millefeuille', 29),
  step(5, 'get-name', 'Eclair Cafe', 'GET', '/pastries/Eclair%20Cafe', 31),
  step(6, 'get-name', 'Eclair Chocolat', 'GET', '/pastries/Eclair%20Chocolat', 27),
  step(7, 'patch-name', 'Eclair Chocolat · price', 'PATCH', '/pastries/Eclair%20Chocolat', 64, [
    { path: '$.price', message: 'string "2.6" found, number expected' },
    { path: '$.status', message: '"sold-out" is not one of: unknown, available' },
  ]),
];

const PASSED_STEPS: TestStepResult[] = STEPS_119.map((s) => ({ ...s, result: 'passed', violations: [] }));

function pastryRun(id: string, startedAt: string, result: TestRun['result'], steps: TestStepResult[], extra: Partial<TestRun> = {}): TestRun {
  const passed = steps.filter((s) => s.result === 'passed').length;
  return {
    id, serviceId: 'pastry2', runner: 'OPEN_API_SCHEMA', environment: 'staging', endpoint: STAGING_BASE, result, startedAt,
    durationMs: steps.reduce((n, s) => n + s.ms, 0) + 1500, passed, total: steps.length, timeoutMs: 10_000, steps, ...extra,
  };
}

/** Seed: #119 (just now, same bug as workflow run #14), #118, #117 and some history; WP9 adds the rest of the 21 runs. */
export function seedTestRuns(): TestRun[] {
  const failedPatch = (ms = 60) => STEPS_119.map((s, i) => (i === 6 ? { ...s, ms } : { ...s, result: 'passed' as const, violations: [] }));
  return [
    pastryRun('119', '2026-11-03T09:10:04Z', 'failed', STEPS_119, { reason: 'PATCH /pastries/{name} · price returned as a string, a number is expected' }),
    pastryRun('118', '2026-11-03T07:10:04Z', 'passed', PASSED_STEPS),
    pastryRun('117', '2026-11-03T04:10:04Z', 'failed', failedPatch(), { reason: 'PATCH /pastries/{name} · 400 Bad Request · schema mismatch on price' }),
    pastryRun('116', '2026-11-02T17:05:04Z', 'passed', PASSED_STEPS, { runner: 'HTTP', environment: 'prod' }),
    pastryRun('115', '2026-11-02T10:12:04Z', 'passed', PASSED_STEPS),
    pastryRun('114', '2026-10-31T15:48:04Z', 'passed', PASSED_STEPS, { environment: 'prod' }),
    {
      ...pastryRun('41', '2026-11-03T08:25:04Z', 'passed', PASSED_STEPS.slice(0, 1)),
      serviceId: 'orders', runner: 'ASYNC_API_SCHEMA', endpoint: 'kafka://broker.staging.acme.io:9092',
    },
  ];
}

const toSummary = ({ steps: _steps, timeoutMs: _t, secretName: _s, ...summary }: TestRun): TestRunSummary => summary;

export function createInMemoryTestingAdapters(_deps: InMemoryDeps = {}): TestingAdapters {
  const runs = seedTestRuns();
  let next = 120;

  const testRuns: TestRunRepository = {
    listForService: (serviceId, filter: TestRunFilter = {}) =>
      after(() => {
        const out = runs
          .filter((r) => r.serviceId === serviceId)
          .filter((r) => !filter.result || filter.result === 'all' || (filter.result === 'passed' ? r.result === 'passed' : r.result !== 'passed'))
          .filter((r) => !filter.runner || r.runner === filter.runner)
          .filter((r) => !filter.environment || r.environment === filter.environment)
          .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
          .map(toSummary);
        return filter.limit ? out.slice(0, filter.limit) : out;
      }),
    recent: (limit) => after(() => [...runs].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, limit).map(toSummary)),
    get: (id) => after(() => runs.find((r) => r.id === id)),
    create: (input: CreateTestInput) =>
      after(() => {
        const created = pastryRun(String(next++), '2026-11-03T09:10:04Z', 'running', STEPS_119.map((s) => ({ ...s, result: 'passed' as const, violations: [] })), {
          serviceId: input.serviceId, runner: input.runner, endpoint: input.endpoint, timeoutMs: input.timeoutMs, secretName: input.secretName,
        });
        runs.push(created);
        return created;
      }),
    watch: (id) => {
      const run = runs.find((r) => r.id === id);
      if (!run) throw new NotFoundError('Test run', id);
      const snapshots: TestRun[] = run.steps.map((_, i) => {
        const steps = run.steps.slice(0, i + 1);
        const last = i === run.steps.length - 1;
        return { ...run, steps, passed: steps.filter((s) => s.result === 'passed').length, total: run.steps.length, result: last ? (run.result === 'running' ? 'passed' : run.result) : 'running' };
      });
      return createSequenceStream(snapshots);
    },
  };
  return { testRuns };
}
