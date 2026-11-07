/**
 * HTTP adapters of the observe feature.
 *
 * Microcks API v1.15 (`api/microcks-openapi-v1.15.yaml`, tag `metrics`):
 * - `GET /metrics/invocations/{serviceName}/{serviceVersion}?day=yyyyMMdd`: `invocations()` (the hours of today, or
 *   one request per day of the week or month) and the series of a service on the Usage page;
 * - `GET /metrics/invocations/global?day=yyyyMMdd` and `GET /metrics/invocations/global/latest?limit=<days>`: the
 *   hourly and daily series of all services;
 * - `GET /metrics/conformance/service/{serviceId}`: score, index (`maxPossibleScore`), domain and trend of each
 *   service of the treemap, listed with `GET /services/count` and `GET /services` (the catalogue API).
 * Microcks keys invocation metrics by service name and version, read from `GET /services/{id}`.
 *
 * Demo-only (proposition v2 / not in Microcks API): `/api/demo/usage/...` (per-operation rows, comparison periods
 * and texts of the Usage page), `/api/demo/traces/...` and `/api/demo/traffic/...` (Microcks keeps counters, not
 * the calls themselves: no call log, topology or replay).
 *
 * Live streams (Live traces, Cockpit ticker): Microcks has no feed of mock calls (no SSE, no WebSocket), and no new
 * one is invented. Each subscription polls `GET /api/demo/{traces,traffic}/calls?after=<last seq>&limit=1`, the next
 * poll `intervalMs` (3200 ms for traces, 1200 ms for the ticker, as the in-memory streams) after the previous one
 * settles: one request in flight at most, missed ticks skipped (no catch-up burst), see `pollingStream`. It emits what
 * comes back, in order; the trace filter is applied on the client.
 */
import { matchesTraceFilter, type Period, type TraceCall } from '@/domain/observe';
import type { MetricsRepository, TraceStream, TrafficStream } from '@/application/ports/observe';
import type { Clock } from '@/application/ports/shared';
import { NotFoundError, type Listener, type Unsubscribe } from '@/application/shared';
import type { HttpClient } from '@/infrastructure/http/client';
import type { MicrocksCounter, MicrocksService } from '@/infrastructure/http/catalog/dto';
import type {
  DemoTraceCalls,
  DemoTraceTopology,
  DemoUsageReport,
  DemoUsageScopes,
  MicrocksCounterMap,
  MicrocksDailyInvocationStatistic,
  MicrocksTestConformanceMetric,
} from './dto';
import { daysBetween, daysEnding, fromCounterMap, fromHourlyCount, groupByDomain, PERIOD_DAYS, toConformanceItem, toInvocations, toMicrocksDay, toUsageData } from './mapping';

export interface HttpObserveDeps {
  http: HttpClient;
  clock: Clock;
}

export interface HttpObserveAdapters {
  metrics: MetricsRepository;
  traces: TraceStream;
  traffic: TrafficStream;
}

/** Same paces as the in-memory streams. */
export const TRACE_POLL_MS = 3200;
export const TRAFFIC_POLL_MS = 1200;

/**
 * A stream that polls `fetchAfter(<seq of the last emitted call>, signal)` and emits what it returns, in order.
 * Self-scheduling: the next poll is scheduled `intervalMs` after the previous one SETTLES, so at most one request is
 * in flight and a stall (slow answer, throttled tab) never triggers a burst of catch-up requests: missed ticks are
 * skipped, the stream simply resumes from the last seq. A failed poll is skipped the same way. Unsubscribing clears
 * the pending tick and aborts the request in flight (its answer, if any, is dropped).
 */
function pollingStream(fetchAfter: (after: number | undefined, signal: AbortSignal) => Promise<TraceCall[]>, intervalMs: number) {
  return (listener: Listener<TraceCall>): Unsubscribe => {
    let after: number | undefined;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const poll = async () => {
      timer = undefined;
      try {
        const calls = await fetchAfter(after, controller.signal);
        for (const call of calls) {
          if (stopped) return;
          after = call.seq;
          listener(call);
        }
      } catch {
        // Skipped: the next tick asks again from the same seq.
      }
      if (!stopped) timer = setTimeout(poll, intervalMs);
    };
    timer = setTimeout(poll, intervalMs);
    return () => {
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
      controller.abort();
    };
  };
}

export function createHttpObserveAdapters({ http, clock }: HttpObserveDeps): HttpObserveAdapters {
  const today = () => clock.now().toISOString().slice(0, 10);
  /** Hours of today so far, the current one included. */
  const hoursSoFar = () => clock.now().getUTCHours() + 1;
  const enc = encodeURIComponent;

  const services = new Map<string, Promise<MicrocksService>>();
  /** Name and version of a service (Microcks keys invocation metrics by them), cached per adapter. */
  function service(serviceId: string): Promise<MicrocksService> {
    let found = services.get(serviceId);
    if (!found) {
      found = http.get<MicrocksService>(`services/${enc(serviceId)}`);
      found.catch(() => services.delete(serviceId));
      services.set(serviceId, found);
    }
    return found;
  }

  function serviceStats(s: MicrocksService, days: readonly string[]): Promise<MicrocksDailyInvocationStatistic[]> {
    const path = `metrics/invocations/${enc(s.name)}/${enc(s.version)}`;
    return Promise.all(days.map((d) => http.get<MicrocksDailyInvocationStatistic>(path, { query: { day: toMicrocksDay(d) } })));
  }

  async function invocations(serviceId: string, period: Period) {
    const days = period === 'day' ? [today()] : daysEnding(today(), PERIOD_DAYS[period]);
    return toInvocations(serviceId, period, await serviceStats(await service(serviceId), days));
  }

  async function series(scope: string, dailyStart: string): Promise<{ daily: number[]; hourly: number[] }> {
    const days = daysBetween(dailyStart, today());
    if (scope === 'all') {
      const [latest, todayStat] = await Promise.all([
        http.get<MicrocksCounterMap>('metrics/invocations/global/latest', { query: { limit: days.length } }),
        http.get<MicrocksDailyInvocationStatistic>('metrics/invocations/global', { query: { day: toMicrocksDay(today()) } }),
      ]);
      return { daily: fromCounterMap(latest, days), hourly: fromHourlyCount(todayStat, hoursSoFar()) };
    }
    // Microcks serves one day per request for a service.
    const stats = await serviceStats(await service(scope), days);
    return { daily: stats.map((s) => s.dailyCount), hourly: fromHourlyCount(stats.at(-1), hoursSoFar()) };
  }

  async function conformanceByDomain() {
    const { counter } = await http.get<MicrocksCounter>('services/count');
    const all = counter === 0 ? [] : await http.get<MicrocksService[]>('services', { query: { page: 0, size: counter } });
    // A2A agents are scored by their own conformance matrix (Agent test runs), not by contract tests.
    const apis = all.filter((s) => s.type !== 'A2A');
    const metrics = await Promise.all(apis.map((s) => http.get<MicrocksTestConformanceMetric | undefined>(`metrics/conformance/service/${enc(s.id)}`)));
    return groupByDomain(apis.map((s, i) => ({ item: toConformanceItem(s, metrics[i]), domain: metrics[i]?.aggregationLabelValue })));
  }

  const metrics: MetricsRepository = {
    invocations,
    conformanceByDomain,
    async usageData(scope) {
      const report = await http.get<DemoUsageReport>(`demo/usage/${enc(scope)}`);
      const { daily, hourly } = await series(scope, report.dailyStart);
      return toUsageData(report, daily, hourly);
    },
    usageScopes: () => http.get<DemoUsageScopes>('demo/usage/scopes'),
  };

  const calls = (feed: 'traces' | 'traffic') => (after: number | undefined, signal: AbortSignal) =>
    http.get<DemoTraceCalls>(`demo/${feed}/calls`, { query: { after, limit: 1 }, signal });
  const traceFeed = pollingStream(calls('traces'), TRACE_POLL_MS);

  const traces: TraceStream = {
    subscribe: (filter, listener) => traceFeed((call) => (matchesTraceFilter(call, filter) ? listener(call) : undefined)),
    replay: (callId) => http.post<TraceCall>(`demo/traces/calls/${enc(callId)}/replay`),
    async get(callId) {
      try {
        return await http.get<TraceCall>(`demo/traces/calls/${enc(callId)}`);
      } catch (error) {
        if (error instanceof NotFoundError) return undefined;
        throw error;
      }
    },
    topology: () => http.get<DemoTraceTopology>('demo/traces/topology'),
  };

  const traffic: TrafficStream = {
    subscribe: pollingStream(calls('traffic'), TRAFFIC_POLL_MS),
    recent: (limit) => http.get<DemoTraceCalls>('demo/traffic/recent', { query: { limit } }),
  };

  return { metrics, traces, traffic };
}
