import type { ServiceSummary } from '@/domain/shared';
import { conformanceScore } from '@/domain/shared';
import { CLOCK_NOW_ISO, SERVICES } from '../../shared';

/**
 * The 10 services of the Catalogue prototype, with one fix over the foundation seed: API Pastry 2.0's latest
 * test is #119 (failed, just now), the same bug as workflow run #14 (`price` comes back as the string "3.9").
 * #118 (passed) stays in the history. Its conformance is the score of its last per-operation results.
 */
export const CATALOG_SERVICES: ServiceSummary[] = SERVICES.map((service) => {
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
});
