import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Segmented from './Segmented.svelte';

describe('Segmented options', () => {
  it('colours and sizes the icons, and exposes the fill, size and spacing hooks', async () => {
    const { container } = render(Segmented, {
      props: {
        label: 'Status',
        value: 'imported',
        onchange: () => {},
        pressedFill: 'selected',
        iconSize: 13,
        spacing: 'wide',
        options: [{ id: 'all', label: 'All' }, { id: 'imported', label: 'Imported', icon: 'check', iconTone: 'success' }],
      },
    });
    const group = screen.getByRole('group', { name: 'Status' });
    expect(group.getAttribute('data-pressed-fill')).toBe('selected');
    expect(group.getAttribute('data-spacing')).toBe('wide');
    const icon = screen.getByRole('button', { name: 'Imported' }).querySelector('svg')!;
    expect(icon.getAttribute('width')).toBe('13');
    expect(icon.getAttribute('data-tone')).toBe('success');
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('has a compact joined size', () => {
    render(Segmented, { props: { label: 'Script language', variant: 'joined', size: 'sm', value: 'g', onchange: () => {}, options: [{ id: 'g', label: 'Groovy' }, { id: 'j', label: 'JavaScript' }] } });
    expect(screen.getByRole('group', { name: 'Script language' }).getAttribute('data-size')).toBe('sm');
  });
});

describe('Segmented', () => {
  it('presses one button at a time, reads counts after a comma and calls onchange', async () => {
    const onchange = vi.fn();
    render(Segmented, { props: { label: 'Result', value: 'all', onchange, options: [{ id: 'all', label: 'All', count: 3 }, { id: 'failed', label: 'Failed', dot: 'danger', count: 1 }] } });
    const failed = screen.getByRole('button', { name: /^Failed\s*,\s*1$/ });
    expect(screen.getByRole('button', { name: /^All\s*,\s*3$/ }).getAttribute('aria-pressed')).toBe('true');
    expect(failed.getAttribute('aria-pressed')).toBe('false');
    expect(failed.querySelector('.segmented-dot')!.getAttribute('aria-hidden')).toBe('true');
    await fireEvent.click(failed);
    expect(onchange).toHaveBeenCalledWith('failed');
    expect(failed.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /^All\s*,\s*3$/ }).getAttribute('aria-pressed')).toBe('false');
  });
});
