// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { StepChecks, StepStatus } from './step-status';

afterEach(cleanup);

describe('StepStatus', () => {
  it('writes Passed, Failed and Not run', () => {
    const { rerender } = render(<StepStatus status="passed" />);
    expect(screen.getByText('Passed')).toBeTruthy();
    rerender(<StepStatus status="failed" />);
    expect(screen.getByText('Failed')).toBeTruthy();
    rerender(<StepStatus status="not-run" />);
    expect(screen.getByText('Not run')).toBeTruthy();
  });

  it('shows the attempt count on a failed step', () => {
    const { container } = render(<StepStatus status="failed" attempts={3} />);
    expect(container.textContent).toBe('Failed· 3 attempts');
  });

  it('does not show a single successful attempt', () => {
    const { container } = render(<StepStatus status="passed" attempts={1} />);
    expect(container.textContent).toBe('Passed');
  });
});

describe('StepChecks', () => {
  it('lists the two checks with their labels and words', () => {
    render(<StepChecks successCriteria="passed" schemaValidation="failed" />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toContain('Success criteria');
    expect(items[0]?.textContent).toContain('Passed');
    expect(items[1]?.textContent).toContain('Schema validation');
    expect(items[1]?.textContent).toContain('Failed');
  });

  it('omits schema validation when the run does not validate schemas', () => {
    render(<StepChecks successCriteria="passed" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});
