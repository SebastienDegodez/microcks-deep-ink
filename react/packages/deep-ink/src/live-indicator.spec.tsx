import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../test/axe';
import { LiveIndicator } from './live-indicator';

describe('LiveIndicator', () => {
  it('keeps the default pill and pulse without adding a live region', () => {
    const { container } = render(<LiveIndicator />);
    const indicator = screen.getByText('live');
    expect(indicator.getAttribute('data-size')).toBe('md');
    expect(indicator.getAttribute('data-variant')).toBe('pill');
    expect(indicator.hasAttribute('data-pulse')).toBe(false);
    expect(container.querySelector('.live-dot')!.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('status')).toBeNull();
    expect(indicator.hasAttribute('aria-live')).toBe(false);
  });

  it('renders the compact static pill and updates its pulse setting', async () => {
    const { container, rerender } = render(<LiveIndicator size="compact" pulse={false} />);
    expect(screen.getByText('live').getAttribute('data-size')).toBe('compact');
    expect(screen.getByText('live').getAttribute('data-pulse')).toBe('false');
    expect(await axeViolations(container)).toEqual([]);
    rerender(<LiveIndicator size="compact" pulse />);
    expect(screen.getByText('live').hasAttribute('data-pulse')).toBe(false);
  });

  it('still writes the paused state and removes the dot', () => {
    const { container } = render(<LiveIndicator size="compact" pulse={false} paused pausedLabel="paused · 2 new calls" />);
    expect(screen.getByText('paused · 2 new calls').hasAttribute('data-paused')).toBe(true);
    expect(container.querySelector('.live-dot')).toBeNull();
    expect(container.querySelector('.icon')).toBeTruthy();
  });
});
