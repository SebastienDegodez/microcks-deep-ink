// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { ConformanceItem } from '@/domain/observe';
import type { MicrocksService } from '@/infrastructure/http/catalog/dto';
import { createHttpClient } from '@/infrastructure/http/client';
import { createInMemoryObserveAdapters } from '@/infrastructure/in-memory/observe';
import { FixedClock } from '@/infrastructure/in-memory/shared';
import { createObserveHandlers } from '@/infrastructure/msw/handlers/observe';
import { server } from '@/infrastructure/msw/node';
import { createHttpObserveAdapters } from '.';
import {
  daysBetween,
  daysEnding,
  fromCounterMap,
  fromHourlyCount,
  fromMicrocksDay,
  fromTrend,
  groupByDomain,
  toConformanceItem,
  toConformanceMetric,
  toCounterMap,
  toDailyStatistic,
  toInvocations,
  toMicrocksDay,
  toTrend,
} from './mapping';

const SERVICE: MicrocksService = {
  id: 'pastry2', name: 'API Pastry', version: '2.0', type: 'REST', sourceArtifact: 'apipastry-openapi.yaml',
  operations: [{ name: 'GET /pastries', method: 'GET' }, { name: 'GET /pastries/{name}', method: 'GET' }],
};

describe('days', () => {
  it('converts between ISO dates and Microcks yyyyMMdd', () => {
    expect(toMicrocksDay('2026-11-03T09:10:04Z')).toBe('20261103');
    expect(fromMicrocksDay('20261103')).toBe('2026-11-03');
  });

  it('lists days across months, both ends included', () => {
    expect(daysBetween('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
    expect(daysEnding('2026-11-03', 3)).toEqual(['2026-11-01', '2026-11-02', '2026-11-03']);
    expect(daysBetween('2026-08-17', '2026-11-03')).toHaveLength(79);
  });
});

describe('Microcks metrics -> domain', () => {
  it('reads the hours of a DailyInvocationStatistic, missing hours being 0', () => {
    expect(fromHourlyCount({ hourlyCount: { '0': 4, '2': 2, '9': 28 } }, 10)).toEqual([4, 0, 2, 0, 0, 0, 0, 0, 0, 28]);
    expect(fromHourlyCount(undefined, 2)).toEqual([0, 0]);
  });

  it('reads a CounterMap in the order of the requested days', () => {
    expect(fromCounterMap({ '20261103': 5, '20261101': 7 }, ['2026-11-01', '2026-11-02', '2026-11-03'])).toEqual([7, 0, 5]);
  });

  it('maps a day statistic to 24 hourly points and several statistics to daily points', () => {
    const today = toInvocations('pastry2', 'day', [{ id: 'x', day: '20261103', serviceName: 'API Pastry', serviceVersion: '2.0', dailyCount: 9, hourlyCount: { '1': 4, '23': 5 } }]);
    expect(today.points).toHaveLength(24);
    expect(today.points[1]).toEqual({ at: '2026-11-03T01:00:00Z', calls: 4 });
    expect(today.total).toBe(9);
    const week = toInvocations('pastry2', 'week', [
      toDailyStatistic('API Pastry', '2.0', '2026-11-02', 3),
      toDailyStatistic('API Pastry', '2.0', '2026-11-03', 8),
    ]);
    expect(week).toEqual({ serviceId: 'pastry2', period: 'week', points: [{ at: '2026-11-02', calls: 3 }, { at: '2026-11-03', calls: 8 }], total: 11 });
  });

  it('maps the five Microcks trends to up, down or stable', () => {
    expect((['UP', 'LOW_UP', 'STABLE', 'LOW_DOWN', 'DOWN'] as const).map(fromTrend)).toEqual(['up', 'up', 'stable', 'down', 'down']);
    expect(fromTrend(undefined)).toBeNull();
  });

  it('builds a treemap item: no score until a first test (lastUpdateDay), index from maxPossibleScore', () => {
    const tested = { id: 'm', serviceId: 'pastry2', maxPossibleScore: 92, currentScore: 86, lastUpdateDay: '20261103', latestTrend: 'LOW_UP' as const };
    expect(toConformanceItem(SERVICE, tested)).toEqual({ serviceId: 'pastry2', name: 'API Pastry 2.0', protocol: 'REST', operations: 2, score: 86, index: 92, trend: 'up' });
    expect(toConformanceItem(SERVICE, { id: 'm', serviceId: 'pastry2', maxPossibleScore: 70, currentScore: 0 })).toMatchObject({ score: null, index: 70, trend: null });
  });

  it('groups by aggregation label value, averaging the tested scores only', () => {
    const item = (serviceId: string, score: number | null): ConformanceItem => ({ serviceId, name: serviceId, protocol: 'REST', operations: 1, score, index: 90, trend: null });
    const groups = groupByDomain([
      { item: item('a', 80), domain: 'pastry' },
      { item: item('b', null), domain: undefined },
      { item: item('c', 91), domain: 'pastry' },
      { item: item('d', null), domain: 'pastry' },
    ]);
    expect(groups.map((g) => [g.domain, g.label, g.score, g.services])).toEqual([['pastry', 'domain=pastry', 86, 3], ['other', 'no domain label', null, 1]]);
  });
});

describe('domain -> Microcks metrics (the mock API)', () => {
  it('serialises a day statistic with its hourly counts', () => {
    expect(toDailyStatistic('API Pastry', '2.0', '2026-11-03', 6, [4, 2])).toEqual({
      id: 'API Pastry:2.0:20261103', day: '20261103', serviceName: 'API Pastry', serviceVersion: '2.0', dailyCount: 6, hourlyCount: { '0': 4, '1': 2 },
    });
    expect(toCounterMap(['2026-11-02', '2026-11-03'], [1, 2])).toEqual({ '20261102': 1, '20261103': 2 });
  });

  it('round-trips a conformance item through TestConformanceMetric', () => {
    const item: ConformanceItem = { serviceId: 'pastry2', name: 'API Pastry 2.0', protocol: 'REST', operations: 2, score: 86, index: 92, trend: 'down' };
    const metric = toConformanceMetric(item, 'pastry', '2026-11-03');
    expect(metric).toMatchObject({ aggregationLabelValue: 'pastry', maxPossibleScore: 92, currentScore: 86, lastUpdateDay: '20261103', latestTrend: 'DOWN' });
    expect(toConformanceItem(SERVICE, metric)).toEqual(item);
    const untested = toConformanceMetric({ ...item, score: null, trend: null }, undefined, '2026-11-03');
    expect(untested).not.toHaveProperty('lastUpdateDay');
    expect(untested).not.toHaveProperty('aggregationLabelValue');
    expect(toTrend(null)).toBeUndefined();
  });
});

describe('http adapters over the mock API serve what the in-memory adapters serve', () => {
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const both = () => {
    server.use(...createObserveHandlers());
    return {
      memory: createInMemoryObserveAdapters({ clock: new FixedClock() }),
      http: createHttpObserveAdapters({ http: createHttpClient({ baseUrl: 'http://demo.test/api/' }), clock: new FixedClock() }),
    };
  };

  it('conformance by domain, usage scopes and the usage series of a service and of all', async () => {
    const { memory, http } = both();
    expect(await http.metrics.conformanceByDomain()).toEqual(await memory.metrics.conformanceByDomain());
    expect(await http.metrics.usageScopes()).toEqual(await memory.metrics.usageScopes());
    expect(await http.metrics.usageData('pastry2')).toEqual(await memory.metrics.usageData('pastry2'));
    expect(await http.metrics.usageData('all')).toEqual(await memory.metrics.usageData('all'));
  });

  it('the topology, a call and the recent traffic', async () => {
    const { memory, http } = both();
    expect(await http.traces.topology()).toEqual(await memory.traces.topology());
    expect(await http.traces.get('call-3')).toEqual(await memory.traces.get('call-3'));
    expect(await http.traffic.recent(5)).toEqual(await memory.traffic.recent(5));
  });
});
