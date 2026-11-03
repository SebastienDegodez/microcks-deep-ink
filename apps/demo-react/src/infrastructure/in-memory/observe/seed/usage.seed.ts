import type { Protocol } from '@/domain/shared';
import type { ConformanceItem, UsageData, UsageRowData } from '@/domain/observe';

const N = 79;
const noise = (d: number, k: number) => {
  const v = Math.sin(d * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** Daily invocations from Mon Aug 17 to Tue Nov 3, 2026 (79 days, the last one is partial). Deterministic. */
function dailySeries(): { pastry: number[]; all: number[] } {
  const pastry: number[] = [];
  const all: number[] = [];
  for (let d = 0; d < N; d += 1) {
    const weekday = d % 7;
    const weekend = weekday === 5 ? 0.6 : weekday === 6 ? 0.5 : 1;
    let p = (95 + d * 1.5) * weekend * (0.8 + 0.4 * noise(d, 1));
    if (d === 58) p *= 2.3; // Wed Oct 14: CI pipeline replays
    pastry.push(Math.round(p));
    all.push(Math.round(p * 1.9 + 60 * weekend * noise(d, 2)));
  }
  const p7 = [187, 228, 248, 255, 249, 329];
  const a7 = [430, 488, 530, 541, 462, 578];
  for (let i = 0; i < 6; i += 1) {
    pastry[N - 7 + i] = p7[i] ?? 0;
    all[N - 7 + i] = a7[i] ?? 0;
  }
  return { pastry, all };
}

/** Hours 00 to 09 of today (the demo clock is 09:10): each series sums to the "today" column of its table. */
const HOURLY_PASTRY = [4, 0, 2, 1, 1, 6, 16, 42, 96, 128];
const HOURLY_ALL = [10, 2, 4, 2, 2, 12, 30, 80, 184, 248];
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

const OPERATION_ROWS: UsageRowData[] = [
  { id: 'get-list', name: '/pastries', method: 'GET', detail: 'URI_PARAMS · size', today: 56, w7: 412, trend: { today: 9, '7d': 14, '30d': 11 }, last: '2 min ago', live: false },
  { id: 'get-name', name: '/pastries/{name}', method: 'GET', detail: 'URI_PARTS · name', today: 228, w7: 1284, trend: { today: 15, '7d': 19, '30d': 24 }, last: '12 s ago', live: true },
  { id: 'patch-name', name: '/pastries/{name}', method: 'PATCH', detail: 'URI_PARTS · name', today: 12, w7: 96, trend: { today: -8, '7d': 3, '30d': -2 }, last: '41 min ago', live: false },
];

const sv = (id: string, protocol: Protocol, name: string, detail: string, today: number, w7: number, trend: UsageRowData['trend'], last: string, live = false): UsageRowData => ({
  id, protocol, name, detail, today, w7, trend, last, live,
});

const SERVICE_ROWS: UsageRowData[] = [
  sv('pastry2', 'REST', 'API Pastry 2.0', '3 ops', 296, 1792, { today: 12, '7d': 18, '30d': 22 }, '12 s ago', true),
  sv('movie', 'GRAPHQL', 'Movie Graph API 1.0', '4 ops', 124, 812, { today: 6, '7d': 4, '30d': 9 }, '1 min ago'),
  sv('pastry1', 'REST', 'API Pastry 1.0', '3 ops', 71, 466, { today: -14, '7d': -21, '30d': -30 }, '9 min ago'),
  sv('hellogrpc', 'gRPC', 'HelloService v1', '1 op', 52, 341, { today: 4, '7d': 2, '30d': 5 }, '4 min ago'),
  sv('petstore', 'REST', 'Petstore API 1.0.0', '4 ops', 18, 119, { today: 20, '7d': 35, '30d': 60 }, '22 min ago'),
  sv('hellosoap', 'SOAP', 'HelloService Mock 0.9', '1 op', 9, 52, { today: 0, '7d': -4, '30d': -6 }, '1 h ago'),
  sv('beer', 'REST', 'Beer Catalog API 0.9', '3 ops', 3, 17, { today: 0, '7d': -15, '30d': -12 }, '3 h ago'),
  sv('rocks', 'DIRECT', 'Rocks 0.1', '5 ops', 1, 4, { today: 0, '7d': 0, '30d': -50 }, '2 d ago'),
];

/** Usage series of a service (`pastry2` is detailed) or of every service (`all`). Other services get a scaled-down view. */
export function usageDataFor(scope: string): UsageData {
  const { pastry, all } = dailySeries();
  const detailed = scope !== 'all';
  const hourly = detailed ? HOURLY_PASTRY : HOURLY_ALL;
  const daily = (detailed ? pastry : all).slice();
  daily[N - 1] = sum(hourly);
  return {
    scope,
    label: detailed ? 'API Pastry 2.0' : 'All services',
    dailyStart: '2026-08-17',
    scopeLine: detailed ? '3 operations · mock at /rest/API+Pastry/2.0' : '10 services · 26 operations · mock invocations of sync APIs',
    daily,
    hourly,
    previous: detailed ? { today: 264, '7d': 1519, '30d': 5310 } : { today: 529, '7d': 3170, '30d': 10950 },
    lastCall: 'GET /rest/API+Pastry/2.0/pastries/Millefeuille',
    rows: detailed ? OPERATION_ROWS : SERVICE_ROWS,
    tableNote: detailed
      ? 'Counted when the mock answers a request, whatever the example served. Dispatcher misses still count and show up as 404 in Live traces.'
      : 'Event APIs (Pastry orders API, User signed-up API) publish on their own schedule: their messages are not invocations and are listed in Live traces.',
    conformance: detailed
      ? {
          title: 'Conformance', score: 92, index: 92, subtitle: 'index 92% · test #118, 2 h ago', trend: 'up, +7 pts',
          advice:
            'All 3 operations passed in test #118, so the score reached the index. To raise the index, add examples: PATCH /pastries/{name} has a single one, and the AI proposal Tartelette Framboise is still pending on GET /pastries/{name}.',
        }
      : {
          title: 'Average conformance', score: 81, index: 90, subtitle: 'index 90% · 7 tested of 10 services', trend: '2 down, 1 up',
          advice:
            'The 9-point gap comes from failing operations, not missing examples: fix Beer Catalog API, API Pastry 1.0 and Movie Graph API first. Petstore, Rocks and User signed-up have an index but no score until a first test runs.',
        },
  };
}

/** Conformance index (examples cover the contract) and trend of each service. The score comes from the catalogue. */
export const CONFORMANCE_INDEX: Record<string, Pick<ConformanceItem, 'index' | 'trend'>> = {
  pastry2: { index: 92, trend: 'up' },
  orders: { index: 100, trend: 'stable' },
  pastry1: { index: 85, trend: 'down' },
  movie: { index: 90, trend: 'down' },
  petstore: { index: 70, trend: null },
  beer: { index: 60, trend: 'stable' },
  usersignedup: { index: 80, trend: null },
  hellosoap: { index: 100, trend: 'stable' },
  rocks: { index: 45, trend: null },
  hellogrpc: { index: 100, trend: 'stable' },
};
