import { describe, expect, it } from 'vitest';
import {
  buildUsageView,
  conformanceBand,
  gapList,
  treemapRows,
  flowCounts,
  heatLevel,
  heatmapWeeks,
  matchesTraceFilter,
  niceMax,
  parseRunParam,
  traceEvents,
  traceIds,
  trendPercent,
  type ConformanceItem,
  type DomainConformance,
  type TraceCall,
  type TraceTopology,
  type UsageData,
} from '@microcks/demo-core/domain/observe';

const call = (over: Partial<TraceCall> = {}): TraceCall => ({
  seq: 1, callId: 'call-1', at: '2026-11-03T09:10:04.208Z', serviceId: 'pastry2', serviceName: 'API Pastry 2.0', protocol: 'REST', method: 'GET',
  path: '/pastries', status: 200, ms: 4, kind: 'REST', ...over,
});

describe('run parameter', () => {
  it('accepts a run id, a whole W3C baggage string and rejects junk', () => {
    expect(parseRunParam('6729a1d27e4c0b5f93a8c214')).toBe('6729a1d27e4c0b5f93a8c214');
    expect(parseRunParam('microcks-arazzo-run=6729a1d27e4c0b5f93a8c214,microcks-arazzo-workflow=restock-pastry,microcks-arazzo-step=patchPastry,microcks-arazzo-attempt=3')).toBe(
      '6729a1d27e4c0b5f93a8c214',
    );
    expect(parseRunParam(encodeURIComponent('microcks-arazzo-run=abc123,microcks-arazzo-step=x'))).toBe('abc123');
    expect(parseRunParam('<script>')).toBeUndefined();
    expect(parseRunParam(null)).toBeUndefined();
  });
});

describe('trace filter', () => {
  const arazzo = call({ baggage: 'microcks-arazzo-run=run14,microcks-arazzo-workflow=restock-pastry,microcks-arazzo-step=getPastry,microcks-arazzo-attempt=1' });
  it('filters by run, Arazzo, status and kind', () => {
    expect(matchesTraceFilter(arazzo, { runId: 'run14' })).toBe(true);
    expect(matchesTraceFilter(arazzo, { runId: 'run1' })).toBe(false);
    expect(matchesTraceFilter(call(), { arazzoOnly: true })).toBe(false);
    expect(matchesTraceFilter(call({ sessionId: 's-7f3a2c91' }), { arazzoOnly: true })).toBe(true);
    expect(matchesTraceFilter(call({ status: 400 }), { status: 'ok' })).toBe(false);
    expect(matchesTraceFilter(call({ kind: 'MCP' }), { kind: 'REST' })).toBe(false);
  });

  it('narrates the span: baggage and a miss', () => {
    const events = traceEvents({ ...arazzo, status: 400, criteria: '/name=x', dispatcher: 'URI_PARTS · rule: name', endpointLabel: '/pastries/{name}' });
    expect(events.map((e) => e.text)).toContain('baggage · workflow restock-pastry · step getPastry · attempt 1');
    expect(events.map((e) => e.text)).toContain('no response found for criteria');
    expect(traceIds(3).traceId).toHaveLength(32);
  });
});

describe('flow counts', () => {
  const topology: TraceTopology = {
    clients: [], endpoints: [], examples: [], history: [],
    clientEdges: [{ id: 'c1e1', from: 'c1', to: 'e1', base: 10 }],
    exampleEdges: [{ id: 'e1d1', from: 'e1', to: 'd1', base: 8 }],
  };
  it('adds the streamed calls to the base counts', () => {
    const counts = flowCounts(topology, [call({ clientId: 'c1', endpointId: 'e1', exampleId: 'd1' }), call({ clientId: 'c9', endpointId: 'e1', exampleId: 'd1' })]);
    expect(counts.clientEdge['c1>e1']).toBe(11);
    expect(counts.client['c1']).toBe(11);
    expect(counts.endpoint['e1']).toBe(11);
    expect(counts.example['d1']).toBe(10);
  });
});

describe('usage view', () => {
  const daily = Array.from({ length: 79 }, (_, i) => 100 + i);
  const data: UsageData = {
    scope: 'pastry2', label: 'API Pastry 2.0', scopeLine: '', dailyStart: '2026-08-17', daily, hourly: [1, 2, 3, 10], previous: { today: 10, '7d': 700, '30d': 3000 },
    lastCall: '', tableNote: '', conformance: { title: 'Conformance', score: 92, index: 92, subtitle: '', subject: '', trend: '', advice: '' },
    rows: [
      { id: 'a', name: 'a', detail: '', today: 6, w7: 300, trend: { today: 1, '7d': 2, '30d': 3 }, last: '', live: false },
      { id: 'b', name: 'b', detail: '', today: 10, w7: 400, trend: { today: 1, '7d': 2, '30d': 3 }, last: '', live: false },
    ],
  };

  it('builds the hourly chart: later hours are still to come', () => {
    const view = buildUsageView(data, 'today');
    expect(view.chart.points).toHaveLength(24);
    expect(view.chart.points.filter((p) => p.future)).toHaveLength(20);
    expect(view.kpis.total).toBe(16);
    expect(view.kpis.peakTitle).toBe('Peak hour');
    expect(view.kpis.growth).toBe(60);
    expect(view.table.total).toBe(16);
    expect(view.table.rows.map((r) => r.share)).toEqual([38, 63]);
  });

  it('builds the daily chart, a heatmap of 12 weeks and a text equivalent', () => {
    const view = buildUsageView(data, '7d');
    expect(view.chart.points.map((p) => p.name)[6]).toBe('Tue, Nov 3');
    expect(view.chart.points.some((p) => p.tick === 'Tue')).toBe(true);
    expect(view.kpis.peakTitle).toBe('Busiest day');
    expect(view.heatmap.cells).toHaveLength(79);
    const weeks = heatmapWeeks(view.heatmap.cells);
    expect(weeks).toHaveLength(12);
    expect(weeks[11]?.values.filter((v) => v !== null)).toHaveLength(2);
    expect(view.heatmap.months[0]).toBe('Aug');
  });

  it('shares the 30 days between rows without losing invocations', () => {
    const view = buildUsageView(data, '30d');
    expect(view.table.rows.reduce((n, r) => n + r.calls, 0)).toBe(daily.slice(49).reduce((a, b) => a + b, 0));
  });

  it('rounds and buckets', () => {
    expect(niceMax(143)).toBe(150);
    expect(niceMax(0)).toBe(1);
    expect(heatLevel(90, 100)).toBe(3);
    expect(heatLevel(10, 100)).toBe(0);
    expect(trendPercent(120, 100)).toBe(20);
    expect(trendPercent(5, 0)).toBe(0);
  });
});

describe('conformance treemap', () => {
  const item = (serviceId: string, operations: number, score: number | null, index: number): ConformanceItem => ({
    serviceId, name: serviceId, protocol: 'REST', operations, score, index, trend: null,
  });
  const domain = (name: string, items: ConformanceItem[]): DomainConformance => ({ domain: name, label: `domain=${name}`, score: null, services: items.length, items });
  const domains = [
    domain('small', [item('s', 1, 100, 100)]),
    domain('big', [item('b1', 1, 50, 90), item('b2', 4, 92, 92)]),
    domain('mid', [item('m', 3, null, 70)]),
  ];

  it('puts the two largest domains on the first row, services by operations', () => {
    const rows = treemapRows(domains);
    expect(rows.map((r) => r.domains.map((d) => d.domain))).toEqual([['big', 'mid'], ['small']]);
    expect(rows[0]?.operations).toBe(8);
    expect(rows[0]?.domains[0]?.items?.map((i) => i.serviceId)).toEqual(['b2', 'b1']);
  });

  it('sorts the gap list by gap, never tested last, and bands the scores', () => {
    expect(gapList(domains).map((i) => i.serviceId)).toEqual(['b1', 's', 'b2', 'm']);
    const tie = (serviceId: string, protocol: ConformanceItem['protocol']) => ({ ...item(serviceId, 1, 100, 100), protocol });
    expect(gapList([domain('t', [tie('grpc', 'gRPC'), tie('soap', 'SOAP'), tie('orders', 'EVENT')])]).map((i) => i.serviceId)).toEqual(['orders', 'soap', 'grpc']);
    expect([92, 67, 33, null].map(conformanceBand)).toEqual(['ok', 'partial', 'risk', 'untested']);
  });
});
