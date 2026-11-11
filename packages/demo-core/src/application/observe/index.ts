import { buildUsageView, type DomainConformance, type Invocations, type Period, type TraceCall, type TraceFilter, type TraceTopology, type UsagePeriod, type UsageScope, type UsageView } from '../../domain/observe/index.js';
import type { ServiceSummary } from '../../domain/shared/index.js';
import type { TestRunSummary } from '../../domain/testing/index.js';
import type { Unsubscribe } from '../shared/index.js';
import type { ServiceCatalog } from '../ports/catalog.js';
import type { Clock } from '../ports/shared.js';
import type { MetricsRepository, TraceStream, TrafficStream } from '../ports/observe.js';
import type { TestRunRepository } from '../ports/testing.js';

/** Observe composes the catalogue and the test runs through their ports (never through other use cases). */
export type ObservePorts = {
  metrics: MetricsRepository;
  traces: TraceStream;
  traffic: TrafficStream;
  catalog: ServiceCatalog;
  testRuns: TestRunRepository;
  clock: Clock;
};

export interface CockpitView {
  /** ISO time the view was composed at (the demo clock). */
  asOf: string;
  kpis: {
    services: number;
    operations: number;
    calls24h: number;
    /** Average conformance of the tested services, null when none is tested. */
    conformance: number | null;
    failingServices: number;
    /** Runs with a verdict (passed or failed) over the 7 days before `asOf`; timeouts are left out. */
    tests7d: { passed: number; failed: number };
  };
  services: ServiceSummary[];
  recentTests: TestRunSummary[];
  /** The 5 latest mock calls, newest first, so Live traces is not empty before the stream ticks. */
  recentCalls: TraceCall[];
}

export interface ObserveUseCases {
  getCockpit(): Promise<CockpitView>;
  /** Live traffic ticker (tick 1200 ms). */
  subscribeTraffic(listener: (call: TraceCall) => void): Unsubscribe;
  invocations(serviceId: string, period: Period): Promise<Invocations>;
  conformanceByDomain(): Promise<DomainConformance[]>;
  /** Live calls matching the filter. */
  subscribeTraces(filter: TraceFilter, listener: (call: TraceCall) => void): Unsubscribe;
  replay(callId: string): Promise<TraceCall>;
  getTrace(callId: string): Promise<TraceCall | undefined>;
  /** Everything the Usage page shows for a service (or `all`) over a period. */
  usage(scope: string, period: UsagePeriod): Promise<UsageView>;
  /** The scopes of the Usage service selector. */
  usageScopes(): Promise<UsageScope[]>;
  /** Who calls what and which example answers, plus the recent calls the live stream continues from. */
  traceTopology(): Promise<TraceTopology>;
}

export function createObserveUseCases(ports: ObservePorts): ObserveUseCases {
  return {
    getCockpit: async () => {
      const [services, latest, recentCalls] = await Promise.all([ports.catalog.list(), ports.testRuns.recent(500), ports.traffic.recent(5)]);
      const now = ports.clock.now();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
      const week = latest.filter((r) => r.startedAt >= weekAgo);
      // The 6 latest runs, at most 2 per service, so one busy service does not fill the list.
      const perService = new Map<string, number>();
      const recentTests = latest
        .filter((r) => {
          const n = perService.get(r.serviceId) ?? 0;
          perService.set(r.serviceId, n + 1);
          return n < 2;
        })
        .slice(0, 6);
      const scored = services.filter((s) => s.conformance !== null);
      return {
        asOf: now.toISOString(),
        kpis: {
          services: services.length,
          operations: services.reduce((n, s) => n + s.operationCount, 0),
          calls24h: services.reduce((n, s) => n + s.calls24h, 0),
          conformance:
            scored.length === 0
              ? null
              : Math.round(scored.reduce((n, s) => n + (s.conformance ?? 0), 0) / scored.length),
          failingServices: services.filter((s) => s.testStatus === 'failed').length,
          tests7d: { passed: week.filter((r) => r.result === 'passed').length, failed: week.filter((r) => r.result === 'failed').length },
        },
        services,
        recentTests,
        recentCalls,
      };
    },
    subscribeTraffic: (listener) => ports.traffic.subscribe(listener),
    invocations: (serviceId, period) => ports.metrics.invocations(serviceId, period),
    conformanceByDomain: () => ports.metrics.conformanceByDomain(),
    subscribeTraces: (filter, listener) => ports.traces.subscribe(filter, listener),
    replay: (callId) => ports.traces.replay(callId),
    getTrace: (callId) => ports.traces.get(callId),
    usage: async (scope, period) => buildUsageView(await ports.metrics.usageData(scope), period),
    usageScopes: () => ports.metrics.usageScopes(),
    traceTopology: () => ports.traces.topology(),
  };
}
