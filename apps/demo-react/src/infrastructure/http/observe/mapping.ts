/**
 * Pure mappings between the domain and the observe wire types (`./dto.ts`), both ways: the HTTP adapters read Microcks
 * metrics into the domain (`from*`), the mock API serialises the in-memory domain into Microcks DTOs (`to*`).
 */
import type { ConformanceItem, DomainConformance, InvocationPoint, Invocations, Period, UsageData } from '@/domain/observe';
import type { MicrocksService } from '@/infrastructure/http/catalog/dto';
import { fromServiceType } from '@/infrastructure/http/catalog/mapping';
import type { DemoUsageReport, MicrocksCounterMap, MicrocksDailyInvocationStatistic, MicrocksTestConformanceMetric, MicrocksTrend } from './dto';

const DAY_MS = 24 * 3600 * 1000;

/** Days of each `invocations()` period: the hours of today, or the last 7 or 30 days, today included. */
export const PERIOD_DAYS: Record<Exclude<Period, 'day'>, number> = { week: 7, month: 30 };

// --- days ---------------------------------------------------------------------------------------------------------

/** ISO date (or date-time) -> Microcks `yyyyMMdd`. */
export const toMicrocksDay = (iso: string): string => iso.slice(0, 10).replaceAll('-', '');
/** Microcks `yyyyMMdd` -> ISO date. */
export const fromMicrocksDay = (day: string): string => `${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}`;

/** ISO dates from `first` to `last`, both included, oldest first. */
export function daysBetween(first: string, last: string): string[] {
  const start = Date.parse(`${first.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${last.slice(0, 10)}T00:00:00Z`);
  const count = Math.max(0, Math.round((end - start) / DAY_MS) + 1);
  return Array.from({ length: count }, (_, i) => new Date(start + i * DAY_MS).toISOString().slice(0, 10));
}

/** The `count` ISO dates that end with `last` (included), oldest first. */
export function daysEnding(last: string, count: number): string[] {
  const end = Date.parse(`${last.slice(0, 10)}T00:00:00Z`);
  return daysBetween(new Date(end - (count - 1) * DAY_MS).toISOString(), last);
}

// --- Microcks -> domain -------------------------------------------------------------------------------------------

/** Calls of the hours `0..hours-1` of a statistic (hours missing from `hourlyCount` had no call). */
export function fromHourlyCount(stat: Pick<MicrocksDailyInvocationStatistic, 'hourlyCount'> | undefined, hours: number): number[] {
  return Array.from({ length: hours }, (_, h) => Number(stat?.hourlyCount?.[String(h)] ?? 0));
}

/** Calls of each day of `days` (ISO dates) in a `CounterMap` keyed by `yyyyMMdd`. */
export function fromCounterMap(counters: MicrocksCounterMap, days: readonly string[]): number[] {
  return days.map((d) => Number(counters[toMicrocksDay(d)] ?? 0));
}

/**
 * `invocations()` from Microcks daily statistics: the 24 hours of the single statistic for `day`, one point per
 * statistic (oldest first) for `week` and `month`.
 */
export function toInvocations(serviceId: string, period: Period, stats: readonly MicrocksDailyInvocationStatistic[]): Invocations {
  let points: InvocationPoint[];
  if (period === 'day') {
    const stat = stats[0];
    const date = stat ? fromMicrocksDay(stat.day) : '';
    points = fromHourlyCount(stat, 24).map((calls, h) => ({ at: `${date}T${String(h).padStart(2, '0')}:00:00Z`, calls }));
  } else {
    points = stats.map((s) => ({ at: fromMicrocksDay(s.day), calls: s.dailyCount }));
  }
  return { serviceId, period, points, total: points.reduce((n, p) => n + p.calls, 0) };
}

/** `UP`/`LOW_UP` -> up, `DOWN`/`LOW_DOWN` -> down, `STABLE` -> stable, no trend -> null. */
export function fromTrend(trend: MicrocksTrend | undefined): ConformanceItem['trend'] {
  if (trend === 'UP' || trend === 'LOW_UP') return 'up';
  if (trend === 'DOWN' || trend === 'LOW_DOWN') return 'down';
  return trend === 'STABLE' ? 'stable' : null;
}

/**
 * One treemap item from a Microcks service and its conformance metric. The score is null while the service was never
 * tested (no `lastUpdateDay`); the index is the best score the examples allow (`maxPossibleScore`).
 */
export function toConformanceItem(service: MicrocksService, metric: MicrocksTestConformanceMetric | undefined): ConformanceItem {
  return {
    serviceId: service.id,
    name: `${service.name} ${service.version}`,
    protocol: fromServiceType(service.type),
    operations: service.operations?.length ?? 0,
    score: metric?.lastUpdateDay ? metric.currentScore : null,
    index: metric?.maxPossibleScore ?? 0,
    trend: fromTrend(metric?.latestTrend),
  };
}

/**
 * Groups the items by their aggregation label value (`domain`), in order of first appearance, with the average score
 * of the tested ones (rounded, null when none is tested). Items without the label go to `other`.
 */
export function groupByDomain(entries: readonly { item: ConformanceItem; domain: string | undefined }[]): DomainConformance[] {
  const byDomain = new Map<string, DomainConformance & { items: ConformanceItem[] }>();
  for (const { item, domain: value } of entries) {
    const domain = value ?? 'other';
    const entry = byDomain.get(domain) ?? { domain, label: value ? `domain=${value}` : 'no domain label', score: null, services: 0, items: [] };
    entry.services += 1;
    entry.items.push(item);
    byDomain.set(domain, entry);
  }
  return [...byDomain.values()].map((entry) => {
    const scores = entry.items.flatMap((i) => (i.score === null ? [] : [i.score]));
    return { ...entry, score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null };
  });
}

/** The Usage data of a scope: the demo report plus the Microcks daily and hourly series. */
export function toUsageData(report: DemoUsageReport, daily: number[], hourly: number[]): UsageData {
  return { ...report, daily, hourly };
}

// --- domain -> Microcks (the mock API) ----------------------------------------------------------------------------

const TREND: Record<NonNullable<ConformanceItem['trend']>, MicrocksTrend> = { up: 'UP', down: 'DOWN', stable: 'STABLE' };

export function toTrend(trend: ConformanceItem['trend']): MicrocksTrend | undefined {
  return trend ? TREND[trend] : undefined;
}

/** A `DailyInvocationStatistic` of `dailyCount` calls on `day` (ISO date), with the calls of each hour when known. */
export function toDailyStatistic(serviceName: string, serviceVersion: string, day: string, dailyCount: number, hourly: readonly number[] = []): MicrocksDailyInvocationStatistic {
  const microcksDay = toMicrocksDay(day);
  return {
    id: `${serviceName}:${serviceVersion}:${microcksDay}`,
    day: microcksDay,
    serviceName,
    serviceVersion,
    dailyCount,
    hourlyCount: Object.fromEntries(hourly.map((calls, h) => [String(h), calls])),
  };
}

/** A `TestConformanceMetric` from a treemap item; `lastUpdateDay` (ISO date) is set only when the service has a score. */
export function toConformanceMetric(item: ConformanceItem, domain: string | undefined, lastUpdateDay: string): MicrocksTestConformanceMetric {
  const trend = toTrend(item.trend);
  return {
    id: `conformance-${item.serviceId}`,
    serviceId: item.serviceId,
    ...(domain ? { aggregationLabelValue: domain } : {}),
    maxPossibleScore: item.index,
    currentScore: item.score ?? 0,
    ...(item.score === null ? {} : { lastUpdateDay: toMicrocksDay(lastUpdateDay) }),
    ...(trend ? { latestTrend: trend } : {}),
  };
}

/** A `CounterMap` keyed by `yyyyMMdd` from ISO dates and their calls. */
export function toCounterMap(days: readonly string[], values: readonly number[]): MicrocksCounterMap {
  return Object.fromEntries(days.map((d, i) => [toMicrocksDay(d), values[i] ?? 0]));
}
