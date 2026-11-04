import type { ServiceSummary } from '@/domain/shared';
import { conformanceScore } from '@/domain/shared';
import { CLOCK_NOW_ISO, SERVICES } from '../../shared';

/**
 * The 11 services of the Catalogue prototype, in its row order, with two fixes over the foundation seed:
 * - API Pastry 2.0's latest test is #119 (failed, just now), the same bug as workflow run #14 (`price` comes back
 *   as the string "3.9"). #118 (passed) stays in the history. Its conformance is the score of its last results.
 * - Pastry concierge's last run #3 counts 13 of 15 conversation checks (Agent test screen), shown as "#3 · 13/15".
 */
const PROTOTYPE_ORDER = ['pastry2', 'orders', 'concierge'];

const withFixes = (service: ServiceSummary): ServiceSummary => {
  if (service.id === 'concierge' && service.lastTest) return { ...service, lastTest: { ...service.lastTest, checks: { passed: 13, total: 15 } } };
  if (service.id !== 'pastry2') return service;
  const lastResults: ('pass' | 'fail')[] = ['pass', 'pass', 'fail'];
  return {
    ...service,
    lastResults,
    testStatus: 'failed',
    lastTest: { runId: '119', when: CLOCK_NOW_ISO },
    conformance: conformanceScore(lastResults),
    updatedAt: service.updatedAt,
  };
};

const rank = (id: string) => {
  const at = PROTOTYPE_ORDER.indexOf(id);
  return at < 0 ? PROTOTYPE_ORDER.length : at;
};

export const CATALOG_SERVICES: ServiceSummary[] = SERVICES.map(withFixes)
  .map((service, index) => ({ service, index }))
  .sort((a, b) => rank(a.service.id) - rank(b.service.id) || a.index - b.index)
  .map(({ service }) => service);
