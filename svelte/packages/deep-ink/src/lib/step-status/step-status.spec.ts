import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import StepChecks from './StepChecks.svelte';
import StepStatus from './StepStatus.svelte';

describe('StepStatus', () => {
  it('writes Passed, Failed and Not run', async () => {
    const { rerender } = render(StepStatus, { props: { status: 'passed' } });
    expect(screen.getByText('Passed')).toBeTruthy();
    await rerender({ status: 'failed' });
    expect(screen.getByText('Failed')).toBeTruthy();
    await rerender({ status: 'not-run' });
    expect(screen.getByText('Not run')).toBeTruthy();
  });

  it('shows the attempt count on a failed step', () => {
    const { container } = render(StepStatus, { props: { status: 'failed', attempts: 3 } });
    expect(container.textContent).toBe('Failed· 3 attempts');
  });

  it('does not show a single successful attempt', () => {
    const { container } = render(StepStatus, { props: { status: 'passed', attempts: 1 } });
    expect(container.textContent).toBe('Passed');
  });

  it('has no axe violations', async () => {
    const { container } = render(StepStatus, { props: { status: 'failed', attempts: 1 } });
    expect(container.textContent).toBe('Failed· 1 attempt');
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('StepChecks', () => {
  it('lists the two checks with their labels and words', async () => {
    const { container } = render(StepChecks, { props: { successCriteria: 'passed', schemaValidation: 'failed' } });
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toContain('Success criteria');
    expect(items[0]?.textContent).toContain('Passed');
    expect(items[1]?.textContent).toContain('Schema validation');
    expect(items[1]?.textContent).toContain('Failed');
    expect(items[1]?.textContent).toBe('Schema validation: Failed');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('omits schema validation when the run does not validate schemas', () => {
    render(StepChecks, { props: { successCriteria: 'passed' } });
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});
