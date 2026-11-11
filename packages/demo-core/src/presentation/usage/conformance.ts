import type { ConformanceBand, ConformanceItem, UsageView } from '../../domain/observe/index.js';

/** `data-protocol` value of each protocol. */
export const PROTO_ATTR: Record<ConformanceItem['protocol'], string> = { REST: 'rest', SOAP: 'soap', EVENT: 'event', gRPC: 'grpc', GRAPHQL: 'graphql', DIRECT: 'direct', A2A: 'a2a' };

/** Icon of a tested band, beside the score: every value is an `IconName` of deep-ink. */
export const BAND_ICON: Partial<Record<ConformanceBand, 'check' | 'warning' | 'close'>> = { ok: 'check', partial: 'warning', risk: 'close' };

/** `1 op`, `7 ops`. */
export const ops = (n: number) => `${n} ${n === 1 ? 'op' : 'ops'}`;

/** Size of a service rectangle's score: `untested`, `lg` from 3 operations, else `md`. */
export const rectSize = (item: ConformanceItem) => (item.score === null ? 'untested' : item.operations >= 3 ? 'lg' : 'md');

/** Icon of the conformance trend direction: every value is an `IconName` of deep-ink. */
export const TREND_ICON: Record<NonNullable<UsageView['conformance']['direction']>, 'trend-up' | 'trend-down' | 'trend-flat'> = {
  up: 'trend-up',
  down: 'trend-down',
  stable: 'trend-flat',
  mixed: 'trend-flat',
};

/** Accessible name of the index bar, averaged over all services when the scope is `all`. */
export const indexBarLabel = (scope: string, score: number | null, index: number) =>
  `${scope === 'all' ? 'Average current score' : 'Current score'} ${score ?? 0} percent, ${scope === 'all' ? 'average ' : ''}conformance index ${index} percent`;
