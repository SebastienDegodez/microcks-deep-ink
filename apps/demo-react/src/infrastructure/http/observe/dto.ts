/**
 * Wire types of the observe API.
 *
 * `Microcks*` types follow the Microcks REST API, OpenAPI `api/microcks-openapi-v1.15.yaml` (Microcks API v1.15.0,
 * https://github.com/microcks/microcks/blob/master/api/microcks-openapi-v1.15.yaml), tag `metrics`:
 * `components/schemas/DailyInvocationStatistic`, `TestConformanceMetric`, `Trend` and `CounterMap`. Only the fields
 * the demo reads are declared.
 *
 * `Demo*` types are the payloads of the demo-only endpoints (`/api/demo/...`): proposition v2 / not in Microcks API.
 */
import type { TraceCall, TraceTopology, UsageData, UsageScope } from '@/domain/observe';

/** `components/schemas/DailyInvocationStatistic`: the mock invocations of a service (or of all, `global`) on a day. */
export interface MicrocksDailyInvocationStatistic {
  id: string;
  /** `yyyyMMdd`. */
  day: string;
  serviceName: string;
  serviceVersion: string;
  dailyCount: number;
  /** Keys `0`..`23`; hours without calls may be missing. */
  hourlyCount?: Record<string, number>;
  /** Keys `0`..`1439`. */
  minuteCount?: Record<string, number>;
}

/** `components/schemas/Trend`. */
export type MicrocksTrend = 'DOWN' | 'LOW_DOWN' | 'STABLE' | 'LOW_UP' | 'UP';

/** `components/schemas/TestConformanceMetric`. */
export interface MicrocksTestConformanceMetric {
  id: string;
  serviceId: string;
  /** Value of the aggregation label (`domain` in the demo), when the service has it. */
  aggregationLabelValue?: string;
  /** Score the examples allow at best: the demo's conformance index. */
  maxPossibleScore: number;
  currentScore: number;
  /** `yyyyMMdd` of the latest score update; missing until a first test ran. */
  lastUpdateDay?: string;
  latestTrend?: MicrocksTrend;
  /** Key `yyyyMMdd`, value the score of that day. */
  latestScores?: Record<string, number>;
}

/** `components/schemas/CounterMap` (`GET /metrics/invocations/global/latest`: key `yyyyMMdd`, value the calls that day). */
export type MicrocksCounterMap = Record<string, number>;

/**
 * Everything the Usage page shows that Microcks has no metric for: per-operation and per-service rows, the comparison
 * periods, the last call and the conformance card texts. The daily and hourly series come from the Microcks metrics.
 */
export type DemoUsageReport = Omit<UsageData, 'daily' | 'hourly'>;

export type DemoUsageScopes = UsageScope[];

export type DemoTraceTopology = TraceTopology;

/** One page of calls (`?after=<seq>&limit=<n>`), oldest first. */
export type DemoTraceCalls = TraceCall[];
