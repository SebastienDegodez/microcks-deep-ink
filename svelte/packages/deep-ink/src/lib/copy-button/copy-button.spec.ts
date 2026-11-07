import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import CopyButton from './CopyButton.svelte';

function mockClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

// The click handler awaits the clipboard: let it settle, then flush the DOM.
async function click(el: HTMLElement) {
  await fireEvent.click(el);
  await vi.advanceTimersByTimeAsync(0);
  await tick();
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
    render(CopyButton, { props: { value: 'curl https://example.com' } });
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('');
    await click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('curl https://example.com');
    expect(status.textContent).toBe('Copied');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy();
    await vi.advanceTimersByTimeAsync(1799);
    expect(status.textContent).toBe('Copied');
    await vi.advanceTimersByTimeAsync(201);
    await tick();
    expect(status.textContent).toBe('');
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
  });

  it('forwards canonical class arrays and xs/link styling through its native button', () => {
    render(CopyButton, { props: {
      value: 'packed', variant: 'outline', tone: 'link', size: 'xs',
      class: ['custom', { active: true, hidden: false }],
    } });
    const button = screen.getByRole('button', { name: 'Copy' });
    expect(button.className).toBe('button copy-button custom active');
    expect(button.dataset.size).toBe('xs');
    expect(button.dataset.tone).toBe('link');
    expect(button.querySelector('svg')?.getAttribute('width')).toBe('14');
  });

  it('announces a failure', async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    render(CopyButton, { props: { value: 'x' } });
    await click(screen.getByRole('button', { name: 'Copy' }));
    expect(screen.getByRole('status').textContent).toBe('Copy failed');
  });

  it('names an icon-only button from the current label', async () => {
    mockClipboard(vi.fn().mockResolvedValue(undefined));
    render(CopyButton, { props: { value: 'x', iconOnly: true, label: 'Copy id' } });
    expect(screen.getByRole('button', { name: 'Copy id' })).toBeTruthy();
    await click(screen.getByRole('button', { name: 'Copy id' }));
    expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy();
  });

  it('has no axe violations', async () => {
    vi.useRealTimers();
    const { container } = render(CopyButton, { props: { value: 'x' } });
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('CopyButton click', () => {
  it('copies instead of calling a given onclick', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    const onclick = vi.fn();
    render(CopyButton, { props: { value: 'v', onclick } as never });
    await fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('v');
    expect(onclick).not.toHaveBeenCalled();
  });
});
