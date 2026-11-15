import type { ServiceSummary } from '../../../../domain/shared/index.js';
import { CLOCK_NOW_ISO, SERVICES } from '../../shared/index.js';

/**
 * The 11 services of the Catalogue prototype, with three fixes over the foundation seed:
 * - API Pastry 2.0's latest test is #119 (failed, just now), the same bug as workflow run #14 (`price` comes back
 *   as the string "3.9"). #118 (passed) stays in the history. Its conformance score stays at 92% (maintainer decision).
 * - Pastry concierge's last run #3 counts 13 of 15 conversation checks (Agent test screen), shown as "#3 · 13/15",
 *   and it was last updated by that run, 1 h ago (Catalogue prototype).
 */

const withFixes = (service: ServiceSummary): ServiceSummary => {
  if (service.id === 'concierge' && service.lastTest) {
    return { ...service, updatedAt: service.lastTest.when, lastTest: { ...service.lastTest, checks: { passed: 13, total: 15 } } };
  }
  if (service.id !== 'pastry2') return service;
  const lastResults: ('pass' | 'fail')[] = ['pass', 'pass', 'fail'];
  return {
    ...service,
    lastResults,
    testStatus: 'failed',
    lastTest: { runId: '119', when: CLOCK_NOW_ISO },
    updatedAt: service.updatedAt,
  };
};

export const CATALOG_SERVICES: ServiceSummary[] = SERVICES.map(withFixes);
