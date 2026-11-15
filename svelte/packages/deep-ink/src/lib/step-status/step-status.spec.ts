import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import StepStatus from './StepStatus.svelte';
import StepChecks from './StepChecks.svelte';
describe('StepStatus', () => {
  it.each([['passed', undefined, 'Passed'], ['failed', 3, 'Failed· 3 attempts'], ['not-run', undefined, 'Not run'], ['passed', 1, 'Passed'], ['failed', 1, 'Failed· 1 attempt'], ['failed', 0, 'Failed'], ['passed', 2, 'Passed· 2 attempts'] ] as const)('writes %s with %s attempts', (status, attempts, text) => {
    const { container } = render(StepStatus, { status, attempts });
    expect(container.textContent?.trim()).toBe(text);
    expect(container.querySelector('[data-status]')?.getAttribute('data-status')).toBe(status);
  });
});
describe('StepChecks', () => {
  it.each(['passed', 'failed', 'off', 'not-evaluated'] as const)('writes two labelled checks (%s)', async schemaValidation => {
    const { container } = render(StepChecks, { successCriteria: 'passed', schemaValidation });
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toBe('Success criteria: Passed');
    expect(items[1]?.getAttribute('data-state')).toBe(schemaValidation);
    expect(items[1]?.textContent).toContain('Schema validation:');
    expect(await axeViolations(container)).toEqual([]);
  });
  it('omits schema validation when the run does not validate schemas', () => {
    render(StepChecks, { successCriteria: 'passed' });
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});
