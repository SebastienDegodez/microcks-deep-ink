import type { DomainConformance, Invocations, Period, TraceCall, TraceFilter, TraceTopology, UsageData } from '@/domain/observe';
import type { Subscribe } from '@/application/shared';

export interface MetricsRepository {
  invocations(serviceId: string, period: Period): Promise<Invocations>;
  conformanceByDomain(): Promise<DomainConformance[]>;
  /** Raw usage series of a service, or of every service with `all`. */
  usageData(scope: string): Promise<UsageData>;
}

export interface TraceStream {
  /** Live calls matching the filter (tick 1200 ms). */
  subscribe(filter: TraceFilter, listener: (call: TraceCall) => void): () => void;
  /** Replays an earlier call: emits a new call with a fresh `seq`. */
  replay(callId: string): Promise<TraceCall>;
  get(callId: string): Promise<TraceCall | undefined>;
  /** Clients, endpoints, examples and the calls of the last minutes (the stream continues from them). */
  topology(): Promise<TraceTopology>;
}

/** Traffic ticker of the Cockpit. */
export interface TrafficStream {
  subscribe: Subscribe<TraceCall>;
}
