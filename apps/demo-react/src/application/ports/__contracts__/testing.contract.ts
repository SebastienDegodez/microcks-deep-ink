import { describe, expect, it } from 'vitest';
import { NotFoundError } from '@/application/shared';
import type { TestingPorts } from '@/application/testing';
import { collectFor, expectSilentAfterUnsubscribe, nextEmission, takeEmissions, useAdapters, useFakeTimers, type MakeAdapters } from './support.contract';

/** The ports the testing feature owns (catalogue and secrets come from other features). */
export type TestingOwnPorts = Pick<TestingPorts, 'testRuns'>;

const STAGING = 'https://pastry.staging.acme.io/v2';
const TICK_MS = 1200;

/** Contract of `TestRunRepository` over the seeded test runs (API Pastry 2.0: #99..#119, #119 failed just now). */
export function describeTestingPortContract(name: string, makeAdapters: MakeAdapters<TestingOwnPorts>): void {
  describe(`testing ports contract · ${name}`, () => {
    const adapters = useAdapters(makeAdapters);
    const testRuns = () => adapters().testRuns;

    describe('TestRunRepository.listForService', () => {
      it('lists the 21 runs of API Pastry 2.0, newest first, as summaries without steps', async () => {
        const runs = await testRuns().listForService('pastry2');
        expect(runs).toHaveLength(21);
        expect(runs.slice(0, 3).map((r) => [r.id, r.result, r.passed])).toEqual([['119', 'failed', 6], ['118', 'passed', 7], ['117', 'failed', 6]]);
        expect(runs.map((r) => r.startedAt)).toEqual([...runs.map((r) => r.startedAt)].sort().reverse());
        expect(runs[0]).not.toHaveProperty('steps');
      });

      it('filters by result and environment, and honours the limit', async () => {
        expect((await testRuns().listForService('pastry2', { result: 'failed' })).map((r) => r.id)).toEqual(['119', '117', '113', '110', '108', '103']);
        expect((await testRuns().listForService('pastry2', { environment: 'local' })).map((r) => r.id)).toEqual(['111', '99']);
        expect((await testRuns().listForService('pastry2', { limit: 2 })).map((r) => r.id)).toEqual(['119', '118']);
      });

      it('returns an empty list for a service without runs', async () => {
        expect(await testRuns().listForService('nope')).toEqual([]);
      });
    });

    describe('TestRunRepository.recent', () => {
      it('returns the most recent runs across services, newest first', async () => {
        const recent = await testRuns().recent(3);
        expect(recent).toHaveLength(3);
        expect(recent[0]?.id).toBe('119');
        expect(recent.map((r) => r.startedAt)).toEqual([...recent.map((r) => r.startedAt)].sort().reverse());
      });
    });

    describe('TestRunRepository.get', () => {
      it('returns run #119 with its failing PATCH step on the price bug', async () => {
        const run = await testRuns().get('119');
        expect(run).toMatchObject({ id: '119', serviceId: 'pastry2', result: 'failed', passed: 6, total: 7, live: true });
        const bad = run?.steps.find((s) => s.result === 'failed');
        expect(bad).toMatchObject({ operationId: 'patch-name', method: 'PATCH' });
        expect(bad?.violations.map((v) => v.path)).toEqual(['$.price', '$.status']);
      });

      it('returns undefined for an unknown run', async () => {
        expect(await testRuns().get('9999')).toBeUndefined();
      });
    });

    describe('TestRunRepository.create', () => {
      it('creates run #120 on staging that hits the price bug again, and lists it first', async () => {
        const created = await testRuns().create({ serviceId: 'pastry2', endpoint: STAGING, runner: 'OPEN_API_SCHEMA', timeoutMs: 10_000 });
        expect(created).toMatchObject({ id: '120', serviceId: 'pastry2', environment: 'staging', result: 'failed', total: 7 });
        expect(await testRuns().get('120')).toMatchObject({ id: '120', result: 'failed' });
        expect((await testRuns().listForService('pastry2'))).toHaveLength(22);
      });

      it('runs only the selected operations and numbers the runs in sequence', async () => {
        const first = await testRuns().create({ serviceId: 'pastry2', endpoint: STAGING, runner: 'OPEN_API_SCHEMA', timeoutMs: 10_000, operations: ['get-list'] });
        expect(first.steps.every((s) => s.operationId === 'get-list')).toBe(true);
        expect(first.result).toBe('passed');
        const second = await testRuns().create({ serviceId: 'beer', endpoint: 'https://beer.staging.acme.io/api', runner: 'POSTMAN', timeoutMs: 5_000 });
        expect(second.id).toBe('121');
        expect(second.serviceId).toBe('beer');
      });
    });

    describe('TestRunRepository.targets', () => {
      it('offers the 7 testable services with the last test derived from their newest run', async () => {
        const targets = await testRuns().targets();
        expect(targets.map((t) => t.serviceId)).toEqual(['pastry2', 'pastry1', 'orders', 'hellogrpc', 'movie', 'hellosoap', 'beer']);
        const pastry2 = targets.find((t) => t.serviceId === 'pastry2');
        expect(pastry2?.operations).toHaveLength(3);
        expect(pastry2?.lastTest).toEqual({ ok: false, text: 'failed · just now' });
      });
    });

    describe('TestRunRepository.watch', () => {
      useFakeTimers();

      it('emits one snapshot per step, in order; the last one carries the final result', async () => {
        const { values, unsubscribe } = await takeEmissions(testRuns().watch('119'), (runs) => runs.at(-1)?.result !== undefined && runs.at(-1)?.result !== 'running');
        expect(values.map((r) => r.steps.length)).toEqual([1, 2, 3, 4, 5, 6, 7]);
        expect(values.slice(0, -1).every((r) => r.result === 'running')).toBe(true);
        expect(values.at(-1)).toMatchObject({ result: 'failed', passed: 6, total: 7 });
        unsubscribe();
      });

      it('stops emitting once unsubscribed', async () => {
        const { value, values, unsubscribe } = await nextEmission(testRuns().watch('119'));
        expect(value.steps).toHaveLength(1);
        await expectSilentAfterUnsubscribe(values, unsubscribe, 10 * TICK_MS);
      });

      it('never delivers a run for an unknown id (the in-memory adapter refuses synchronously with NotFoundError)', async () => {
        let watched: { values: unknown[]; unsubscribe: () => void };
        try {
          watched = await collectFor(testRuns().watch('9999'), 3 * TICK_MS);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundError);
          return;
        }
        watched.unsubscribe();
        expect(watched.values).toEqual([]);
      });
    });
  });
}
