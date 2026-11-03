import { describe, expect, it } from 'vitest';
import { actionLabel, describeAction, runHeadline, stepStripAlt, verdictExplanation } from './describe';
import { END_IF_AVAILABLE, RETRY_PATCH } from './test-helpers';
import type { WorkflowRun } from './run';

const run14 = {
  number: 14, status: 'FAILURE', options: { validateSchemas: true, inputs: {}, timeoutMs: 1 }, target: { kind: 'implementations', baseUrls: {} },
  steps: [
    { stepId: 'listPastries', status: 'passed', attempts: [{}], criteria: [], schema: { state: 'pass' }, flow: { kind: 'next', title: '', text: '' } },
    { stepId: 'patchPastry', status: 'failed', attempts: [{}, {}, {}], criteria: [{ condition: '$statusCode == 200', held: true, evaluation: '$statusCode = 200' }],
      schema: { state: 'fail', message: '/price is a string' }, flow: { kind: 'stop', title: 'x', text: 'y' } },
    { stepId: 'verifyPastry', status: 'not-run', attempts: [], criteria: [], schema: { state: 'off' }, flow: { kind: 'next', title: '', text: '' } },
  ],
} as unknown as WorkflowRun;

describe('describe', () => {
  it('writes actions in words and as loom labels (retry and end only)', () => {
    expect(actionLabel(RETRY_PATCH)).toBe('retry ×2 · 1 s');
    expect(actionLabel(END_IF_AVAILABLE)).toBe("end if $response.body#/status == 'available'");
    expect(describeAction(RETRY_PATCH)).toBe('Retry up to 2 times, waiting 1 s between attempts');
    expect(describeAction(END_IF_AVAILABLE)).toBe("End the workflow when $response.body#/status == 'available'");
  });

  it('gives a text alternative to the step strip', () => {
    expect(stepStripAlt(['passed', 'passed', 'failed', 'not-run'])).toBe('4 steps: passed, passed, failed, not run');
  });

  it('summarises run #14', () => {
    expect(runHeadline(run14)).toEqual({ title: 'Run #14 failed', detail: 'Stops at patchPastry · schema validation, 3 attempts' });
    expect(verdictExplanation(run14)).toBe('Step 2, patchPastry, failed after 3 attempts: /price is a string. The workflow stopped there and produced no outputs.');
  });
});
