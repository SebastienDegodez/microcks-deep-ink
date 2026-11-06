import { describe, expect, it } from 'vitest';
import type { TraceCall } from '@/domain/observe';
import type { ObservePorts } from '@/application/observe';
import { expectSilentAfterUnsubscribe, takeEmissions, useAdapters, useFakeTimers, type MakeAdapters } from './support.contract';

/** The ports the observe feature owns (catalogue, test runs and clock come from elsewhere). */
export type ObserveOwnPorts = Pick<ObservePorts, 'metrics' | 'traces' | 'traffic'>;

/** Arazzo run #14 of restock-pastry (its streamed calls carry `microcks-arazzo-run=<id>` baggage). */
const RUN_14 = '6729a1d27e4c0b5f93a8c214';
const TRACE_TICK_MS = 3200;
const TRAFFIC_TICK_MS = 1200;

/** Contract of `MetricsRepository`, `TraceStream` and `TrafficStream` over the seeded traffic. */
export function describeObservePortContract(name: string, makeAdapters: MakeAdapters<ObserveOwnPorts>): void {
  describe(`observe ports contract · ${name}`, () => {
    const adapters = useAdapters(makeAdapters);

    describe('MetricsRepository.invocations', () => {
      it('returns one point per hour, day or day of the month, and their total', async () => {
        const { metrics } = adapters();
        const day = await metrics.invocations('pastry2', 'day');
        expect(day).toMatchObject({ serviceId: 'pastry2', period: 'day' });
        expect(day.points).toHaveLength(24);
        expect(day.points[0]?.at).toBe('2026-11-03T00:00:00Z');
        expect(day.total).toBe(day.points.reduce((n, p) => n + p.calls, 0));
        expect((await metrics.invocations('pastry2', 'week')).points).toHaveLength(7);
        expect((await metrics.invocations('pastry2', 'month')).points).toHaveLength(30);
      });

      it('is deterministic for the same service and period', async () => {
        const { metrics } = adapters();
        expect(await metrics.invocations('beer', 'week')).toEqual(await metrics.invocations('beer', 'week'));
      });
    });

    describe('MetricsRepository.conformanceByDomain', () => {
      it('groups the API services by domain label with the average score', async () => {
        const domains = await adapters().metrics.conformanceByDomain();
        const pastry = domains.find((d) => d.domain === 'pastry');
        expect(pastry).toMatchObject({ label: 'domain=pastry', score: 86, services: 3 });
        expect(pastry?.items?.map((i) => i.serviceId)).toEqual(['pastry2', 'orders', 'pastry1']);
        expect(domains.find((d) => d.domain === 'pets')?.score).toBeNull();
        expect(domains.find((d) => d.domain === 'other')).toMatchObject({ label: 'no domain label', services: 2 });
      });

      it('leaves the A2A agents out (they have their own conformance matrix)', async () => {
        const items = (await adapters().metrics.conformanceByDomain()).flatMap((d) => d.items ?? []);
        expect(items).toHaveLength(10);
        expect(items.map((i) => i.serviceId)).not.toContain('concierge');
      });
    });

    describe('MetricsRepository.usageScopes / usageData', () => {
      it('offers API Pastry 2.0 then all services', async () => {
        expect(await adapters().metrics.usageScopes()).toEqual([{ id: 'pastry2', label: 'API Pastry 2.0' }, { id: 'all', label: 'All services' }]);
      });

      it('returns the detailed series of a service and the aggregated one of `all`', async () => {
        const { metrics } = adapters();
        expect(await metrics.usageData('pastry2')).toMatchObject({ scope: 'pastry2', label: 'API Pastry 2.0', dailyStart: '2026-08-17' });
        expect(await metrics.usageData('all')).toMatchObject({ scope: 'all', label: 'All services' });
      });
    });

    describe('TraceStream.topology / get / replay', () => {
      it('opens with 4 clients and the 10 calls of the history, two of them from Arazzo run #12', async () => {
        const topology = await adapters().traces.topology();
        expect(topology.clients).toHaveLength(4);
        expect(topology.history.map((c) => c.seq)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(topology.history.filter((c) => c.baggage)).toHaveLength(2);
        expect(topology.history.find((c) => c.sessionId)?.sessionId).toBe('s-7f3a2c91');
      });

      it('returns a call of the history by id', async () => {
        const topology = await adapters().traces.topology();
        expect(await adapters().traces.get('call-6')).toEqual(topology.history[5]);
      });

      it('replays a call as a new call numbered from 1001, stamped after the previous one', async () => {
        const { traces } = adapters();
        const original = await traces.get('call-6');
        const first = await traces.replay('call-6');
        const second = await traces.replay('call-6');
        expect(first).toMatchObject({ seq: 1001, callId: 'call-1001', path: original?.path });
        expect(second.seq).toBe(1002);
        expect(second.at > first.at).toBe(true);
      });
    });

    describe('TraceStream.subscribe', () => {
      useFakeTimers();

      it('streams the calls that follow the history, in order', async () => {
        const { values, unsubscribe } = await takeEmissions<TraceCall>((l) => adapters().traces.subscribe({}, l), 3);
        expect(values.slice(0, 3).map((c) => c.seq)).toEqual([11, 12, 13]);
        await expectSilentAfterUnsubscribe(values, unsubscribe, 3 * TRACE_TICK_MS);
      });

      it('only emits the calls that match the filter', async () => {
        const { values, unsubscribe } = await takeEmissions<TraceCall>((l) => adapters().traces.subscribe({ runId: RUN_14 }, l), 2);
        unsubscribe();
        expect(values.every((c) => c.baggage?.includes(`microcks-arazzo-run=${RUN_14}`))).toBe(true);
      });
    });

    describe('TrafficStream', () => {
      useFakeTimers();

      it('opens with the latest calls, newest first, limited', async () => {
        const recent = await adapters().traffic.recent(3);
        expect(recent.map((c) => c.seq)).toEqual([2005, 2004, 2003]);
        expect(recent.map((c) => c.at)).toEqual([...recent.map((c) => c.at)].sort().reverse());
      });

      it('streams the calls in order and stops on unsubscribe', async () => {
        const { values, unsubscribe } = await takeEmissions(adapters().traffic.subscribe, 2);
        expect(values.slice(0, 2).map((c) => c.seq)).toEqual([11, 12]);
        await expectSilentAfterUnsubscribe(values, unsubscribe, 3 * TRAFFIC_TICK_MS);
      });
    });
  });
}
