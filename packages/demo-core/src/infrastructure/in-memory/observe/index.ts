import { matchesTraceFilter, type DomainConformance, type InvocationPoint, type Invocations, type Period, type TraceCall, type TraceFilter } from '../../../domain/observe/index.js';
import type { MetricsRepository, TraceStream, TrafficStream } from '../../../application/ports/observe.js';
import { SERVICES, after, createTickingStream, type InMemoryDeps } from '../shared/index.js';
import { HISTORY_LENGTH, CLIENT_EDGES, TRACE_TICK_MS, atOf, trafficAt, recentTraffic, EXAMPLE_EDGES, TOPOLOGY_CLIENTS, TOPOLOGY_ENDPOINTS, TOPOLOGY_EXAMPLES, historyCalls, makeCall } from './seed/traces.seed.js';
import { CONFORMANCE_INDEX, usageDataFor } from './seed/usage.seed.js';

export { makeCall } from './seed/traces.seed.js';
export { matchesTraceFilter } from '../../../domain/observe/index.js';

export interface ObserveAdapters {
  metrics: MetricsRepository;
  traces: TraceStream;
  traffic: TrafficStream;
}

const hash = (text: string) => [...text].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 9973, 7);

const PERIOD_POINTS: Record<Period, number> = { day: 24, week: 7, month: 30 };

function invocations(serviceId: string, period: Period): Invocations {
  const service = SERVICES.find((s) => s.id === serviceId);
  const base = Math.max(1, Math.round((service?.calls24h ?? 10) / 24));
  const n = PERIOD_POINTS[period];
  const points: InvocationPoint[] = Array.from({ length: n }, (_, i) => ({
    at: `${period === 'day' ? '2026-11-03T' + String(i).padStart(2, '0') + ':00:00Z' : '2026-10-' + String(31 - ((n - 1 - i) % 31)).padStart(2, '0')}`,
    calls: Math.max(0, Math.round(base * (period === 'day' ? 1 : 24) * (0.6 + ((hash(serviceId) + i * 37) % 80) / 100))),
  }));
  return { serviceId, period, points, total: points.reduce((sum, p) => sum + p.calls, 0) };
}

export function createInMemoryObserveAdapters(_deps: InMemoryDeps = {}): ObserveAdapters {
  let replays = 0;
  // Time of the newest call handed out, so a replay is always stamped after it.
  let newestAt = Date.parse(atOf(HISTORY_LENGTH));
  // Streamed calls continue after the history, so a subscriber starts at call 11. Live traces ticks every
  // 3.2 s like the prototype (~19 calls/min); the Cockpit ticker keeps its own stream at the default pace.
  const stream = createTickingStream(
    (tick) => {
      const call = makeCall(HISTORY_LENGTH + tick + 1);
      newestAt = Math.max(newestAt, Date.parse(call.at));
      return call;
    },
    { intervalMs: TRACE_TICK_MS },
  );
  const trafficStream = createTickingStream((tick) => {
    const seq = HISTORY_LENGTH + tick + 1;
    return { ...makeCall(seq), at: trafficAt(seq) };
  });

  const metrics: MetricsRepository = {
    invocations: (serviceId, period) => after(() => invocations(serviceId, period)),
    usageData: (scope) => after(() => usageDataFor(scope)),
    // Only API Pastry 2.0 has detailed series, as in the prototype.
    usageScopes: () => after(() => [{ id: 'pastry2', label: 'API Pastry 2.0' }, { id: 'all', label: 'All services' }]),
    conformanceByDomain: () =>
      after<DomainConformance[]>(() => {
        const byDomain = new Map<string, DomainConformance>();
        // A2A agents are scored by their own conformance matrix (Agent test runs), not by contract tests:
        // the Usage treemap lists the 10 API services, as in the prototype.
        for (const s of SERVICES.filter((x) => x.protocol !== 'A2A')) {
          const value = s.labels.find((l) => l.key === 'domain')?.value;
          const domain = value ?? 'other';
          const label = value ? `domain=${value}` : 'no domain label';
          const entry = byDomain.get(domain) ?? { domain, label, score: null, services: 0, items: [] };
          entry.services += 1;
          const meta = CONFORMANCE_INDEX[s.id];
          entry.items?.push({
            serviceId: s.id,
            name: `${s.name} ${s.version}`,
            protocol: s.protocol,
            operations: s.operationCount,
            score: s.conformance,
            index: meta?.index ?? 0,
            trend: meta?.trend ?? null,
          });
          byDomain.set(domain, entry);
        }
        return [...byDomain.values()].map((entry) => {
          const scores = (entry.items ?? []).flatMap((i) => (i.score === null ? [] : [i.score]));
          return { ...entry, score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null };
        });
      }),
  };

  const traces: TraceStream = {
    subscribe: (filter: TraceFilter, listener: (call: TraceCall) => void) => stream((call) => (matchesTraceFilter(call, filter) ? listener(call) : undefined)),
    replay: (callId) =>
      after(() => {
        const original = Number(callId.replace('call-', '')) || 1;
        replays += 1;
        // Replayed calls get their own number range, so they never collide with the live ones.
        const seq = 1000 + replays;
        newestAt += 250;
        return { ...makeCall(original), seq, callId: `call-${seq}`, at: new Date(newestAt).toISOString() };
      }),
    get: (callId) => after(() => makeCall(Number(callId.replace('call-', '')) || 1)),
    topology: () =>
      after(() => ({
        clients: TOPOLOGY_CLIENTS,
        endpoints: TOPOLOGY_ENDPOINTS,
        examples: TOPOLOGY_EXAMPLES,
        clientEdges: CLIENT_EDGES,
        exampleEdges: EXAMPLE_EDGES,
        history: historyCalls(),
      })),
  };

  const traffic: TrafficStream = { subscribe: trafficStream, recent: (limit) => after(() => recentTraffic().slice(0, limit)) };
  return { metrics, traces, traffic };
}
