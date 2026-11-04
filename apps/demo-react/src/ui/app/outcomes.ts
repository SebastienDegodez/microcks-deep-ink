import type { TestRunSummary } from '@/domain/testing';
import type { IconName } from '@/ui/components/ui/icon';

/** Result of a test run. */
export type TestResult = TestRunSummary['result'];

/** Capitalised word of a test result; lowercase it for running text. */
export const TEST_RESULT_WORD: Record<TestResult, string> = { passed: 'Passed', failed: 'Failed', timeout: 'Timed out', running: 'Running' };

/** Icon of a test result (check, cross, clock, running). */
export const TEST_RESULT_ICON: Record<TestResult, IconName> = { passed: 'check', failed: 'cross', timeout: 'clock', running: 'running' };

/** Circled icon of a step or check status (the word beside it carries the state). */
export const STATUS_ICON = { pass: 'check-circle', fail: 'x-circle', off: 'minus-circle', pending: 'pending-circle' } as const satisfies Record<string, IconName>;
