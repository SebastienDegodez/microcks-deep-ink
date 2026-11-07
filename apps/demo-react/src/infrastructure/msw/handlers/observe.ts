/**
 * Mock of the observe API (see `src/infrastructure/http/observe/index.ts` for the endpoints): the handlers delegate to
 * the in-memory observe adapters (their seeds, and their state for replays) and serialise the domain into Microcks
 * metrics DTOs (`src/infrastructure/http/observe/dto.ts`).
 *
 * Microcks API v1.15: `GET /metrics/invocations/global[?day]`, `GET /metrics/invocations/global/latest[?limit]`,
 * `GET /metrics/invocations/{serviceName}/{serviceVersion}[?day]`, `GET /metrics/conformance/service/{serviceId}`.
 * Demo-only (proposition v2 / not in Microcks API): every `/api/demo/...` route below. `GET /api/demo/{traces,traffic}/calls`
 * is the page the HTTP adapters poll once per tick: the mock answers with the calls that follow `after` in the seeded
 * stream (one per poll by default), so the live pages show the same calls as with the in-memory streams.
 */
import { http, HttpResponse, type AnyHandler } from 'msw';
import type { ConformanceItem, TraceCall } from '@/domain/observe';
import type { Clock } from '@/application/ports/shared';
import type { DemoTraceCalls, DemoUsageReport, MicrocksCounterMap } from '@/infrastructure/http/observe/dto';
import { daysEnding, fromMicrocksDay, toConformanceMetric, toCounterMap, toDailyStatistic } from '@/infrastructure/http/observe/mapping';
import { createInMemoryCatalogAdapters } from '@/infrastructure/in-memory/catalog';
import { createInMemoryObserveAdapters } from '@/infrastructure/in-memory/observe';
import { atOf, HISTORY_LENGTH, makeCall, trafficAt } from '@/infrastructure/in-memory/observe/seed/traces.seed';
import { FixedClock } from '@/infrastructure/in-memory/shared';
import { API } from './api';

/** Microcks' default for `GET /metrics/invocations/global/latest`. */
const DEFAULT_LATEST_DAYS = 20;
const MAX_PAGE = 50;

export function createObserveHandlers(deps: { clock?: Clock } = {}): AnyHandler[] {
  const clock = deps.clock ?? new FixedClock();
  const { metrics, traces, traffic } = createInMemoryObserveAdapters({ clock });
  const { catalog } = createInMemoryCatalogAdapters({ clock });
  const today = () => clock.now().toISOString().slice(0, 10);

  let replays = 0;
  // Time of the newest call handed out, so a replay is always stamped after it (as the in-memory stream does).
  let newestAt = Date.parse(atOf(HISTORY_LENGTH));

  const notFound = (entity: string, id: string) => HttpResponse.json({ message: `${entity} ${id} not found`, entity, id }, { status: 404 });
  const intParam = (url: URL, name: string, fallback: number, max = Number.MAX_SAFE_INTEGER) => {
    const value = Number(url.searchParams.get(name));
    return url.searchParams.has(name) && Number.isInteger(value) && value >= 0 ? Math.min(value, max) : fallback;
  };
  /** `?day=yyyyMMdd` as an ISO date, today when missing. */
  const dayParam = (url: URL) => {
    const day = url.searchParams.get('day');
    return day && /^\d{8}$/.test(day) ? fromMicrocksDay(day) : today();
  };
  const param = (params: Record<string, unknown>, key: string) => String(params[key]);

  /** The seeded series of a scope (a service id or `all`), as Microcks would count them: calls of `day`, and its hours when it is today. */
  async function callsOn(scope: string, day: string): Promise<{ daily: number; hourly: number[] }> {
    const data = await metrics.usageData(scope);
    const index = Math.round((Date.parse(day) - Date.parse(data.dailyStart)) / 86_400_000);
    return { daily: data.daily[index] ?? 0, hourly: day === today() ? data.hourly : [] };
  }

  /** The calls after `after` (the history when missing), `limit` of them, with the times of the given feed. */
  function nextCalls(url: URL, at: (seq: number) => string): TraceCall[] {
    const after = intParam(url, 'after', HISTORY_LENGTH);
    const limit = intParam(url, 'limit', 1, MAX_PAGE);
    return Array.from({ length: limit }, (_, i) => ({ ...makeCall(after + i + 1), at: at(after + i + 1) }));
  }

  return [
    // --- Microcks API v1.15 -----------------------------------------------------------------------------------------
    http.get(`${API}/metrics/invocations/global/latest`, async ({ request }) => {
      const days = daysEnding(today(), intParam(new URL(request.url), 'limit', DEFAULT_LATEST_DAYS));
      const counts = await Promise.all(days.map(async (d) => (await callsOn('all', d)).daily));
      return HttpResponse.json<MicrocksCounterMap>(toCounterMap(days, counts));
    }),
    http.get(`${API}/metrics/invocations/global`, async ({ request }) => {
      const day = dayParam(new URL(request.url));
      const { daily, hourly } = await callsOn('all', day);
      return HttpResponse.json(toDailyStatistic('*', '*', day, daily, hourly));
    }),
    http.get(`${API}/metrics/invocations/:serviceName/:serviceVersion`, async ({ params, request }) => {
      const name = param(params, 'serviceName');
      const version = param(params, 'serviceVersion');
      const service = (await catalog.list()).find((s) => s.name === name && s.version === version);
      if (!service) return notFound('Service', `${name}:${version}`);
      const day = dayParam(new URL(request.url));
      const { daily, hourly } = await callsOn(service.id, day);
      return HttpResponse.json(toDailyStatistic(name, version, day, daily, hourly));
    }),
    http.get(`${API}/metrics/conformance/service/:serviceId`, async ({ params }) => {
      const id = param(params, 'serviceId');
      let found: { item: ConformanceItem; domain: string | undefined } | undefined;
      for (const d of await metrics.conformanceByDomain()) {
        const item = d.items?.find((i) => i.serviceId === id);
        if (item) found = { item, domain: d.domain === 'other' ? undefined : d.domain };
      }
      return found ? HttpResponse.json(toConformanceMetric(found.item, found.domain, today())) : notFound('Service', id);
    }),

    // --- Demo-only: proposition v2 / not in Microcks API ------------------------------------------------------------
    http.get(`${API}/demo/usage/scopes`, async () => HttpResponse.json(await metrics.usageScopes())),
    http.get(`${API}/demo/usage/:scope`, async ({ params }) => {
      const { daily: _daily, hourly: _hourly, ...report } = await metrics.usageData(param(params, 'scope'));
      return HttpResponse.json<DemoUsageReport>(report);
    }),
    http.get(`${API}/demo/traces/topology`, async () => HttpResponse.json(await traces.topology())),
    http.get(`${API}/demo/traces/calls`, ({ request }) => {
      const calls = nextCalls(new URL(request.url), atOf);
      for (const call of calls) newestAt = Math.max(newestAt, Date.parse(call.at));
      return HttpResponse.json<DemoTraceCalls>(calls);
    }),
    http.get(`${API}/demo/traces/calls/:callId`, async ({ params }) => {
      const call = await traces.get(param(params, 'callId'));
      return call ? HttpResponse.json(call) : notFound('Call', param(params, 'callId'));
    }),
    http.post(`${API}/demo/traces/calls/:callId/replay`, async ({ params }) => {
      const original = await traces.get(param(params, 'callId'));
      if (!original) return notFound('Call', param(params, 'callId'));
      replays += 1;
      // Replayed calls get their own number range, so they never collide with the live ones.
      const seq = 1000 + replays;
      newestAt += 250;
      return HttpResponse.json<TraceCall>({ ...original, seq, callId: `call-${seq}`, at: new Date(newestAt).toISOString() });
    }),
    http.get(`${API}/demo/traffic/calls`, ({ request }) => HttpResponse.json<DemoTraceCalls>(nextCalls(new URL(request.url), trafficAt))),
    http.get(`${API}/demo/traffic/recent`, async ({ request }) => HttpResponse.json<DemoTraceCalls>(await traffic.recent(intParam(new URL(request.url), 'limit', 5, MAX_PAGE)))),
  ];
}
