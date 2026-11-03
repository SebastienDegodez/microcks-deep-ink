import type { Protocol, ServiceSummary } from '@/domain/shared';
import { labelToString } from '@/domain/shared';
import type { ServiceFilter } from './types';

type Facet = 'protocol' | 'label' | 'test';

/** Does the service pass the filter? `skip` ignores one facet (used to count what a chip would give). */
export function matchesServiceFilter(service: ServiceSummary, filter: ServiceFilter, skip?: Facet): boolean {
  const query = (filter.query ?? '').trim().toLowerCase();
  if (query && !`${service.name} ${service.version}`.toLowerCase().includes(query)) return false;
  if (skip !== 'protocol' && filter.protocols?.length && !filter.protocols.includes(service.protocol)) return false;
  if (skip !== 'label' && filter.labels?.length && !filter.labels.every((l) => service.labels.some((x) => labelToString(x) === l))) {
    return false;
  }
  if (skip !== 'test' && filter.testStatus && filter.testStatus !== 'all' && service.testStatus !== filter.testStatus) return false;
  return true;
}

export function filterServices(services: readonly ServiceSummary[], filter: ServiceFilter = {}): ServiceSummary[] {
  return services.filter((s) => matchesServiceFilter(s, filter));
}

export interface ServiceFacets {
  /** Services of each protocol among those matching every OTHER filter. */
  protocols: Partial<Record<Protocol, number>>;
  labels: Record<string, number>;
  testStatus: { all: number; passed: number; failed: number; never: number };
}

/**
 * Counts shown on the filter chips. Each facet ignores its own selection, so a chip announces how many
 * services pressing it would show (the catalogue prototype does the same).
 */
export function facetCounts(services: readonly ServiceSummary[], filter: ServiceFilter = {}): ServiceFacets {
  const protocols: ServiceFacets['protocols'] = {};
  for (const s of services) {
    if (matchesServiceFilter(s, filter, 'protocol')) protocols[s.protocol] = (protocols[s.protocol] ?? 0) + 1;
  }
  const labels: Record<string, number> = {};
  for (const s of services) {
    if (!matchesServiceFilter(s, filter, 'label')) continue;
    for (const l of s.labels) labels[labelToString(l)] = (labels[labelToString(l)] ?? 0) + 1;
  }
  const testStatus = { all: 0, passed: 0, failed: 0, never: 0 };
  for (const s of services) {
    if (!matchesServiceFilter(s, filter, 'test')) continue;
    testStatus.all += 1;
    testStatus[s.testStatus] += 1;
  }
  return { protocols, labels, testStatus };
}

/** Number of active filters, for "Reset (3)". */
export function activeFilterCount(filter: ServiceFilter): number {
  return (
    ((filter.query ?? '').trim() ? 1 : 0) +
    (filter.protocols?.length ?? 0) +
    (filter.labels?.length ?? 0) +
    (filter.testStatus && filter.testStatus !== 'all' ? 1 : 0)
  );
}
