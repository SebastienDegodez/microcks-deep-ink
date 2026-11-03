import type { DomainConformance, Invocations, InvocationPoint, Period, TraceCall, TraceFilter } from '@/domain/observe';
import { baggage } from '@/domain/arazzo';
import type { Protocol } from '@/domain/shared';
import type { MetricsRepository, TraceStream, TrafficStream } from '@/application/ports/observe';
import {
  RUN_IDS,
  SERVICES,
  after,
  createTickingStream,
  type InMemoryDeps,
} from '../shared';

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

/* Deterministic mock traffic. Every 5th call belongs to the Arazzo run #14 (it carries baggage). */
const TRAFFIC: { serviceId: string; method: string; path: string; status: number; example?: string; operationId?: string }[] = [
  { serviceId: 'pastry2', method: 'GET', path: '/pastries?size=M', status: 200, example: 'Size M', operationId: 'get-list' },
  { serviceId: 'pastry2', method: 'GET', path: '/pastries/Eclair%20Cafe', status: 200, example: 'Eclair Cafe', operationId: 'get-name' },
  { serviceId: 'orders', method: 'PUBLISH', path: 'pastry-orders-events', status: 200 },
  { serviceId: 'movie', method: 'QUERY', path: 'movies', status: 200 },
  { serviceId: 'pastry2', method: 'PATCH', path: '/pastries/Eclair%20Chocolat', status: 200, example: 'Eclair Chocolat · price', operationId: 'patch-name' },
  { serviceId: 'hellogrpc', method: 'RPC', path: 'HelloService/greeting', status: 200 },
  { serviceId: 'pastry1', method: 'GET', path: '/pastries/Tarte%20Tatin', status: 400 },
];

export function makeCall(seq: number): TraceCall {
  const t = TRAFFIC[seq % TRAFFIC.length] as (typeof TRAFFIC)[number];
  const service = SERVICES.find((s) => s.id === t.serviceId);
  const arazzo = seq % 5 === 0 && t.serviceId === 'pastry2';
  const stepId = t.method === 'PATCH' ? 'patchPastry' : t.path.includes('size') ? 'listPastries' : 'getPastry';
  return {
    seq,
    callId: `call-${seq}`,
    at: new Date(Date.parse('2026-11-03T09:10:04Z') + seq * 1200).toISOString(),
    serviceId: t.serviceId,
    serviceName: `${service?.name ?? t.serviceId} ${service?.version ?? ''}`.trim(),
    protocol: (service?.protocol ?? 'REST') as Protocol,
    method: t.method,
    path: t.path,
    status: t.status,
    ms: 4 + ((seq * 7) % 40),
    exampleName: t.example,
    operationId: t.operationId,
    baggage: arazzo ? baggage(RUN_IDS[14], 'restock-pastry', stepId, 1) : undefined,
    request: { headers: { accept: 'application/json' } },
    response: { headers: { 'content-type': 'application/json' }, body: t.status === 200 ? '{ "ok": true }' : '{ "error": "no example matches" }' },
  };
}

export function matchesTraceFilter(call: TraceCall, f: TraceFilter): boolean {
  if (f.serviceId && call.serviceId !== f.serviceId) return false;
  if (f.protocol && call.protocol !== f.protocol) return false;
  if (f.status === 'ok' && call.status >= 400) return false;
  if (f.status === 'error' && call.status < 400) return false;
  if (f.arazzoOnly && !call.baggage) return false;
  if (f.runId && !call.baggage?.includes(`microcks-arazzo-run=${f.runId}`)) return false;
  return true;
}

export function createInMemoryObserveAdapters(_deps: InMemoryDeps = {}): ObserveAdapters {
  let replays = 0;
  const stream = createTickingStream((tick) => makeCall(tick + 1));

  const metrics: MetricsRepository = {
    invocations: (serviceId, period) => after(() => invocations(serviceId, period)),
    conformanceByDomain: () =>
      after<DomainConformance[]>(() => {
        const byDomain = new Map<string, { scores: number[]; services: number }>();
        for (const s of SERVICES) {
          const domain = s.labels.find((l) => l.key === 'domain')?.value ?? 'other';
          const entry = byDomain.get(domain) ?? { scores: [], services: 0 };
          entry.services += 1;
          if (s.conformance !== null) entry.scores.push(s.conformance);
          byDomain.set(domain, entry);
        }
        return [...byDomain].map(([domain, e]) => ({
          domain, services: e.services,
          score: e.scores.length ? Math.round(e.scores.reduce((a, b) => a + b, 0) / e.scores.length) : null,
        }));
      }),
  };

  const traces: TraceStream = {
    subscribe: (filter, listener) => stream((call) => (matchesTraceFilter(call, filter) ? listener(call) : undefined)),
    replay: (callId) =>
      after(() => {
        const original = Number(callId.replace('call-', '')) || 0;
        replays += 1;
        return { ...makeCall(original), seq: 1000 + replays, callId: `call-${1000 + replays}` };
      }),
    get: (callId) => after(() => makeCall(Number(callId.replace('call-', '')) || 0)),
  };

  const traffic: TrafficStream = { subscribe: stream };
  return { metrics, traces, traffic };
}
