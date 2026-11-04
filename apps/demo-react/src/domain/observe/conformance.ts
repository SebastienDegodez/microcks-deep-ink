import type { ConformanceItem, DomainConformance } from './types';

/** Conformance band of a score: `ok` >= 80, `partial` 50..79, `risk` < 50, `untested` when never tested. */
export type ConformanceBand = 'ok' | 'partial' | 'risk' | 'untested';

export function conformanceBand(score: number | null): ConformanceBand {
  if (score === null) return 'untested';
  return score >= 80 ? 'ok' : score >= 50 ? 'partial' : 'risk';
}

export const BAND_TEXT: Record<ConformanceBand, string> = {
  ok: 'conformant',
  partial: 'partial',
  risk: 'at risk',
  untested: 'never tested',
};

export interface TreemapDomain extends DomainConformance {
  operations: number;
}

export interface TreemapRow {
  operations: number;
  domains: TreemapDomain[];
}

const opsOf = (items: readonly ConformanceItem[] | undefined) => (items ?? []).reduce((n, i) => n + i.operations, 0);

/**
 * Lays the domains out in two rows, biggest first: the two largest domains share the first row,
 * the others the second. Inside a domain, services are sorted by operations (stable). Pure.
 */
export function treemapRows(domains: readonly DomainConformance[]): TreemapRow[] {
  const sized = domains
    .map((d) => ({ ...d, items: [...(d.items ?? [])].sort((a, b) => b.operations - a.operations), operations: opsOf(d.items) }))
    .sort((a, b) => b.operations - a.operations);
  const rows = [sized.slice(0, 2), sized.slice(2)].filter((r) => r.length > 0);
  return rows.map((r) => ({ operations: r.reduce((n, d) => n + d.operations, 0), domains: r }));
}

/** Services sorted by the gap between their index and their score; never tested services last. Pure. */
export function gapList(domains: readonly DomainConformance[]): ConformanceItem[] {
  const gap = (i: ConformanceItem) => i.index - (i.score ?? 0);
  return domains
    .flatMap((d) => d.items ?? [])
    .sort((a, b) => Number(a.score === null) - Number(b.score === null) || gap(b) - gap(a));
}
