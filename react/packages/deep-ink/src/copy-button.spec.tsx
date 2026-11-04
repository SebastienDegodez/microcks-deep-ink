import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../test/axe';
import { CopyButton } from './copy-button';

function mockClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

describe('CopyButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies the value, switches the label and announces it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render(<CopyButton value="curl https://example.com" />);
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    });
    expect(writeText).toHaveBeenCalledWith('curl https://example.com');
    expect(status.textContent).toBe('Copied');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(status.textContent).toBe('');
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
  });

  it('announces a failure', async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    render(<CopyButton value="x" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    });
    expect(screen.getByRole('status').textContent).toBe('Copy failed');
  });

  it('names an icon-only button from the current label', async () => {
    mockClipboard(vi.fn().mockResolvedValue(undefined));
    render(<CopyButton value="x" iconOnly label="Copy id" />);
    expect(screen.getByRole('button', { name: 'Copy id' })).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy id' }));
    });
    expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy();
  });

  it('has no axe violations', async () => {
    vi.useRealTimers();
    const { container } = render(<CopyButton value="x" />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
