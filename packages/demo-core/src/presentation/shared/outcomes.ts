import type { RunStatus } from '../../domain/arazzo/index.js';
import type { TestRunSummary } from '../../domain/testing/index.js';

/** Names of the design-system icons the outcomes below use: every one is an `IconName` of deep-ink. */
export type OutcomeIcon = 'check' | 'cross' | 'clock' | 'running' | 'check-circle' | 'x-circle' | 'minus-circle' | 'pending-circle';

/** Result of a test run. */
export type TestResult = TestRunSummary['result'];

/** Capitalised word of a test result; lowercase it for running text. */
export const TEST_RESULT_WORD: Record<TestResult, string> = { passed: 'Passed', failed: 'Failed', timeout: 'Timed out', running: 'Running' };

/** Icon of a test result (check, cross, clock, running). */
export const TEST_RESULT_ICON: Record<TestResult, OutcomeIcon> = { passed: 'check', failed: 'cross', timeout: 'clock', running: 'running' };

/** Circled icon of a step or check status (the word beside it carries the state). */
export const STATUS_ICON = { pass: 'check-circle', fail: 'x-circle', off: 'minus-circle', pending: 'pending-circle' } as const satisfies Record<string, OutcomeIcon>;

/** Capitalised word of a workflow run status; lowercase it for running text. */
export const RUN_STATUS_WORD: Record<RunStatus, string> = { SUCCESS: 'Passed', FAILURE: 'Failed', RUNNING: 'Running' };

/** Circled icon of a workflow run status (check, cross, running). */
export const RUN_STATUS_ICON: Record<RunStatus, OutcomeIcon> = { SUCCESS: 'check-circle', FAILURE: 'x-circle', RUNNING: 'running' };
