import type { ServiceFilter } from '../../domain/catalog/index.js';
import type { ServiceSummary } from '../../domain/shared/index.js';
import { fmt } from '../shared/format.js';

/** Word of a last test result, in the "Last test" column and the filter. */
export const TEST_WORD = { passed: 'Conformant', failed: 'Failing', never: 'Never tested' } as const;

/** Tone of a conformance score: 90 and 60 are the thresholds of the catalogue. */
export const levelOf = (c: number | null): 'neutral' | 'success' | 'warning' | 'danger' => (c === null ? 'neutral' : c >= 90 ? 'success' : c >= 60 ? 'warning' : 'danger');

/** Status badge of the last test of a service. */
export const outcomeOf = (s: ServiceSummary): 'conformant' | 'failed' | 'never' => (s.testStatus === 'passed' ? 'conformant' : s.testStatus === 'failed' ? 'failed' : 'never');

/** Mock calls of the last 24 hours: messages for an event API, requests otherwise. */
export const callsText = (s: ServiceSummary) => `${fmt(s.calls24h)} ${s.protocol === 'EVENT' ? 'msg' : 'req'}`;

/** The label chips of the filter panel (the prototype shows a curated set, not every label). */
export const FEATURED_LABELS: readonly string[] = ['domain=pastry', 'domain=movies', 'status=GA', 'status=beta', 'team=platform'];

/** Run, checks and age of the last test, joined with " · ". */
export const lastTestText = (s: ServiceSummary, relative: (d: string) => string) => (s.lastTest ? [`#${s.lastTest.runId}`, s.lastTest.checks ? `${s.lastTest.checks.passed}/${s.lastTest.checks.total}` : null, relative(s.lastTest.when)].filter(Boolean).join(' · ') : 'no test run yet');

/** Page of the last test of a service: the agent runner for A2A, the test runner otherwise, the test list when never tested. */
export const testsHref = (s: ServiceSummary) => (s.lastTest ? (s.protocol === 'A2A' ? `/tests/agent/${s.lastTest.runId}` : `/tests/runner/${s.lastTest.runId}`) : '/tests');

/** Number of active filters: the query, each protocol, each label and the test result. */
export const activeFilterCount = (filter: ServiceFilter) =>
  (filter.query?.trim() ? 1 : 0) + (filter.protocols?.length ?? 0) + (filter.labels?.length ?? 0) + (filter.testStatus && filter.testStatus !== 'all' ? 1 : 0);

/** Active filters as words, for the "no match" message. */
export const activeFilterWords = (filter: ServiceFilter): string[] => [
  ...(filter.query?.trim() ? [`“${filter.query.trim()}”`] : []),
  ...(filter.protocols ?? []),
  ...(filter.labels ?? []),
  ...(filter.testStatus && filter.testStatus !== 'all' ? [TEST_WORD[filter.testStatus]] : []),
];
