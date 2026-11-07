// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { FixedClock } from '@/infrastructure/in-memory/shared';
import { seedTestRuns, TEST_TARGETS } from '@/infrastructure/in-memory/testing';
import { toMicrocksMessages, toMicrocksTestResult } from '@/infrastructure/msw/handlers/testing';
import { toTestRun, toTestRunSummary, toTestTarget } from './mapping';
import { testCaseId, testCaseIdFromPath, testCaseIdToPath, toIsoDate, type MicrocksTestResult } from './microcks';

/** A Microcks `TestResult` as Microcks itself serves it (no demo extension). */
const PLAIN: MicrocksTestResult = {
  id: '6566f1a2c1e8b2', version: 2, testNumber: 7, testDate: Date.parse('2026-11-03T09:00:00Z'), testedEndpoint: 'http://localhost:8282/v2',
  serviceId: 'pastry2', elapsedTime: 412, success: false, inProgress: false, runnerType: 'OPEN_API_SCHEMA', timeout: 5000,
  secretRef: { secretId: 's1', name: 'staging-token' },
  testCaseResults: [
    { operationName: 'GET /pastries', success: true, elapsedTime: 80, testStepResults: [{ requestName: 'Size S', success: true, elapsedTime: 80 }] },
    {
      operationName: 'PATCH /pastries/{name}', success: false, elapsedTime: 60,
      testStepResults: [{ requestName: 'Eclair Chocolat', success: false, elapsedTime: 60, message: 'instance type (string) does not match' }],
    },
  ],
};

describe('Microcks TestResult -> domain', () => {
  it('maps a plain Microcks result: status, dates, counts and steps grouped by operation', () => {
    const run = toTestRun(PLAIN, new Map([[testCaseId(PLAIN, 'PATCH /pastries/{name}'), [{
      type: 'reqRespPair' as const,
      request: { name: 'Eclair Chocolat', operationId: 'op', content: '{"price":2.6}' },
      response: { name: 'Eclair Chocolat', operationId: 'op', status: '200', content: '{"price":"2.6"}' },
    }]]]));
    expect(run).toMatchObject({
      id: '6566f1a2c1e8b2', serviceId: 'pastry2', runner: 'OPEN_API_SCHEMA', endpoint: 'http://localhost:8282/v2', result: 'failed',
      startedAt: '2026-11-03T09:00:00Z', durationMs: 412, passed: 1, total: 2, timeoutMs: 5000, secretName: 'staging-token',
    });
    expect(run.steps).toEqual([
      { id: 's1', operationId: 'GET /pastries', name: 'Size S', method: 'GET', path: '/pastries', ms: 80, result: 'passed', violations: [] },
      {
        id: 's2', operationId: 'PATCH /pastries/{name}', name: 'Eclair Chocolat', method: 'PATCH', path: '/pastries/{name}', ms: 60, result: 'failed',
        violations: [{ path: '$', message: 'instance type (string) does not match' }], httpStatus: 200, requestBody: '{"price":2.6}', payload: { price: '2.6' },
      },
    ]);
  });

  it('maps inProgress to running, success to passed, and the demo timeout flag to timeout', () => {
    expect(toTestRunSummary({ ...PLAIN, inProgress: true }).result).toBe('running');
    expect(toTestRunSummary({ ...PLAIN, success: true }).result).toBe('passed');
    expect(toTestRunSummary({ ...PLAIN, demo: { environment: 'local', timedOut: true } })).toMatchObject({ result: 'timeout', environment: 'local' });
  });

  it('summaries carry no steps', () => {
    expect(toTestRunSummary(PLAIN)).not.toHaveProperty('steps');
  });

  it('round-trips every seeded run through the Microcks DTO and its messages', () => {
    for (const run of seedTestRuns()) {
      const dto = toMicrocksTestResult(run);
      const messages = new Map((dto.testCaseResults ?? []).map((c) => {
        const id = testCaseId(dto, c.operationName);
        return [id, toMicrocksMessages(run, id)] as const;
      }));
      expect(toTestRun(dto, messages), `run #${run.id}`).toEqual(run);
    }
  });

  it('serialises run #119 as a Microcks result: one test case per operation, testNumber 119, failure message on the PATCH step', () => {
    const dto = toMicrocksTestResult(seedTestRuns()[0]!);
    expect(dto).toMatchObject({ id: '119', testNumber: 119, success: false, inProgress: false, runnerType: 'OPEN_API_SCHEMA', timeout: 10_000 });
    expect(dto.testCaseResults?.map((c) => [c.operationName, c.success, c.testStepResults?.length])).toEqual([
      ['GET /pastries', true, 3], ['GET /pastries/{name}', true, 3], ['PATCH /pastries/{name}', false, 1],
    ]);
    expect(dto.testCaseResults?.[2]?.testStepResults?.[0]?.message).toContain('instance type (string)');
  });
});

describe('test case ids and dates', () => {
  it('builds <id>-<testNumber>-<operationName> and encodes it for the path like Microcks (`/` -> `!`)', () => {
    const id = testCaseId({ id: '119', testNumber: 119 }, 'GET /pastries/{name}');
    expect(id).toBe('119-119-GET /pastries/{name}');
    expect(testCaseIdToPath(id)).toBe('119-119-GET%20!pastries!%7Bname%7D');
    expect(testCaseIdFromPath(testCaseIdToPath(id))).toBe(id);
  });

  it('formats epoch milliseconds as the demo ISO dates', () => {
    expect(toIsoDate(Date.parse('2026-11-03T09:10:04Z'))).toBe('2026-11-03T09:10:04Z');
    expect(toIsoDate(Date.parse('2026-11-03T09:10:04.250Z'))).toBe('2026-11-03T09:10:04.250Z');
  });
});

describe('demo test target -> domain', () => {
  const now = new FixedClock().now();
  const pastry2 = TEST_TARGETS[0]!;

  it('derives "last test" from the latest run, relative to the clock', () => {
    const target = toTestTarget({ ...pastry2, latestTest: { id: '119', serviceId: 'pastry2', success: false, testDate: now.getTime() } }, now);
    expect(target.lastTest).toEqual({ ok: false, text: 'failed · just now' });
    expect(target).not.toHaveProperty('latestTest');
  });

  it('keeps the fallback when the service has no run', () => {
    expect(toTestTarget(pastry2, now)).toEqual(pastry2);
  });
});
