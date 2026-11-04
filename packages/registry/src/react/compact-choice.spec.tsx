import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './checkbox';
import { CopyButton } from './copy-button';

describe('Compact choice card and copy state', () => {
  it('has a compact card variant', () => {
    render(<Checkbox variant="compact" label="GET /pastries" checked onChange={() => {}} />);
    expect(screen.getByRole('checkbox', { name: 'GET /pastries' }).closest('label')?.getAttribute('data-variant')).toBe('compact');
  });

  it('flags the copied state for 1.8 s', async () => {
    vi.useFakeTimers();
    Object.assign(navigator, { clipboard: { writeText: () => Promise.resolve() } });
    render(<CopyButton value="x" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    });
    expect(screen.getByRole('button', { name: 'Copied' }).getAttribute('data-state')).toBe('copied');
    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(screen.getByRole('button', { name: 'Copy' }).hasAttribute('data-state')).toBe(false);
    vi.useRealTimers();
  });
});
