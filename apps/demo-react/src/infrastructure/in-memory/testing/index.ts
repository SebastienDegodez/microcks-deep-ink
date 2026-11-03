import { filterRuns, type CreateTestInput, type TestRun, type TestRunSummary, type TestStepResult, type TestTarget } from '@/domain/testing';
import type { TestRunFilter, TestRunRepository } from '@/application/ports/testing';
import { NotFoundError } from '@/application/shared';
import { after, createSequenceStream, type InMemoryDeps } from '../shared';
import { ENDPOINTS, OPERATION_LABELS, failingSteps, seedTestRuns } from './seed/test-runs.seed';
import { TEST_TARGETS } from './seed/test-targets.seed';

export { seedTestRuns } from './seed/test-runs.seed';
export { TEST_TARGETS } from './seed/test-targets.seed';

export interface TestingAdapters {
  testRuns: TestRunRepository;
}

const toSummary = ({ steps: _steps, timeoutMs: _t, secretName: _s, live: _l, operationLabels: _o, launchedBy: _u, ...summary }: TestRun): TestRunSummary => summary;

/** Steps of a run launched from the form, from the operations the user selected. */
function stepsForNewRun(input: CreateTestInput, target: TestTarget | undefined): TestStepResult[] {
  const selected = input.operations ?? target?.operations.map((o) => o.id) ?? [];
  if (input.serviceId === 'pastry2') {
    // The staging implementation still has the price bug: a new run hits it too, like #119.
    const steps = failingSteps().filter((s) => selected.includes(s.operationId));
    return input.endpoint === ENDPOINTS.staging ? steps : steps.map((s) => ({ ...s, result: 'passed' as const, violations: [] }));
  }
  const steps: TestStepResult[] = [];
  for (const op of target?.operations ?? []) {
    if (!selected.includes(op.id)) continue;
    for (let i = 1; i <= op.samples; i += 1) {
      steps.push({ id: `s${steps.length + 1}`, operationId: op.id, name: `Sample ${i}`, method: op.verb, path: op.path, ms: 30 + i * 7, result: 'passed', violations: [] });
    }
  }
  return steps;
}

export function createInMemoryTestingAdapters(_deps: InMemoryDeps = {}): TestingAdapters {
  const runs = seedTestRuns();
  let next = 120;

  const testRuns: TestRunRepository = {
    listForService: (serviceId, filter: TestRunFilter = {}) =>
      after(() => {
        const out = filterRuns(
          runs.filter((r) => r.serviceId === serviceId),
          filter,
        )
          .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
          .map(toSummary);
        return filter.limit ? out.slice(0, filter.limit) : out;
      }),
    recent: (limit) => after(() => [...runs].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, limit).map(toSummary)),
    get: (id) => after(() => runs.find((r) => r.id === id)),
    create: (input: CreateTestInput) =>
      after(() => {
        const target = TEST_TARGETS.find((t) => t.serviceId === input.serviceId);
        const steps = stepsForNewRun(input, target);
        const failed = steps.some((s) => s.result === 'failed');
        const passed = steps.filter((s) => s.result === 'passed').length;
        const environment = (Object.entries(ENDPOINTS).find(([, url]) => url === input.endpoint)?.[0] ?? 'staging') as TestRun['environment'];
        const created: TestRun = {
          id: String(next++), serviceId: input.serviceId, runner: input.runner, environment, endpoint: input.endpoint,
          result: failed ? 'failed' : 'passed', startedAt: '2026-11-03T09:10:04Z',
          durationMs: steps.reduce((n, s) => n + s.ms + 60, 140), passed, total: steps.length, timeoutMs: input.timeoutMs,
          secretName: input.secretName, steps, live: true, launchedBy: 'MA',
          operationLabels: input.serviceId === 'pastry2' ? OPERATION_LABELS : (target?.operations.map((o) => ({ id: o.id, method: o.verb, path: o.path })) ?? []),
          operations: [],
        };
        runs.push(created);
        return created;
      }),
    watch: (id) => {
      const run = runs.find((r) => r.id === id);
      if (!run) throw new NotFoundError('Test run', id);
      const snapshots: TestRun[] = run.steps.map((_, i) => {
        const steps = run.steps.slice(0, i + 1);
        const last = i === run.steps.length - 1;
        return { ...run, steps, passed: steps.filter((s) => s.result === 'passed').length, total: run.steps.length, result: last ? run.result : 'running' };
      });
      return createSequenceStream(snapshots);
    },
    targets: () => after(() => TEST_TARGETS),
  };
  return { testRuns };
}
