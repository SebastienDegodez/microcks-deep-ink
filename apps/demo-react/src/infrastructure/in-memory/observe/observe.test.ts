import { describe, expect, it, vi } from 'vitest';
import { createObserveUseCases } from '@/application/observe';
import type { ServiceCatalog } from '@/application/ports/catalog';
import type { TestRunRepository } from '@/application/ports/testing';
import { FixedClock, SERVICES, RUN_IDS } from '../shared';
import { createInMemoryObserveAdapters } from './index';

function setup() {
  const adapters = createInMemoryObserveAdapters();
  const catalog = { list: async () => SERVICES } as unknown as ServiceCatalog;
  const testRuns = { recent: async () => [] } as unknown as TestRunRepository;
  return createObserveUseCases({ ...adapters, catalog, testRuns, clock: new FixedClock() });
}

describe('observe use cases', () => {
  it('shows the usage of API Pastry 2.0 and of all services', async () => {
    const uc = setup();
    const today = await uc.usage('pastry2', 'today');
    expect(today.kpis.total).toBe(296);
    expect(today.table.rows.reduce((n, r) => n + r.calls, 0)).toBe(296);
    expect(today.table.rows.map((r) => r.detail)).toEqual(['URI_PARAMS · size', 'URI_PARTS · name', 'URI_PARTS · name']);
    const week = await uc.usage('pastry2', '7d');
    expect(week.kpis.total).toBe(1792);
    expect(week.heatmap.cells).toHaveLength(79);
    const all = await uc.usage('all', '30d');
    expect(all.table.firstColumn).toBe('Service');
    expect(all.table.rows).toHaveLength(8);
  });

  it('groups the conformance by domain with the services of each domain', async () => {
    const uc = setup();
    const domains = await uc.conformanceByDomain();
    const pastry = domains.find((d) => d.domain === 'pastry');
    expect(pastry?.items?.map((i) => i.serviceId)).toEqual(['pastry2', 'orders', 'pastry1']);
    expect(pastry?.label).toBe('domain=pastry');
    expect(pastry?.score).toBe(86);
    expect(domains.find((d) => d.domain === 'pets')?.score).toBeNull();
    expect(domains.find((d) => d.domain === 'other')).toMatchObject({ label: 'no domain label', services: 2 });
  });

  it('opens Live traces with 10 calls, among them Arazzo run #12 and the verification session', async () => {
    const uc = setup();
    const topology = await uc.traceTopology();
    expect(topology.history).toHaveLength(10);
    expect(topology.history.filter((c) => c.baggage).map((c) => c.baggage?.includes(RUN_IDS[12]))).toEqual([true, true]);
    expect(topology.history.find((c) => c.sessionId)?.sessionId).toBe('s-7f3a2c91');
    expect(topology.clients).toHaveLength(4);
    expect(topology.examples.find((e) => !e.ok)?.label).toBe('No matching example');
  });

  it('streams calls that continue after the history and filters by Arazzo run #14', async () => {
    vi.useFakeTimers();
    try {
      const uc = setup();
      const seqs: number[] = [];
      const run14: string[] = [];
      const stopAll = uc.subscribeTraces({}, (c) => seqs.push(c.seq));
      const stopRun = uc.subscribeTraces({ runId: RUN_IDS[14] }, (c) => run14.push(c.baggage ?? ''));
      await vi.advanceTimersByTimeAsync(1200 * 14);
      stopAll();
      stopRun();
      expect(seqs.slice(0, 3)).toEqual([11, 12, 13]);
      expect(run14.length).toBeGreaterThanOrEqual(2);
      expect(run14.every((b) => b.includes(`microcks-arazzo-run=${RUN_IDS[14]}`))).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('replays a call as a new one at the top', async () => {
    const uc = setup();
    const first = await uc.replay('call-6');
    const second = await uc.replay('call-6');
    expect(first.callId).toBe('call-1001');
    expect(second.seq).toBeGreaterThan(first.seq);
    expect(first.path).toBe((await uc.getTrace('call-6'))?.path);
  });
});
