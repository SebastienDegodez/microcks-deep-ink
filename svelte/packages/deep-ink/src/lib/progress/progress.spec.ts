import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Meter from './Meter.svelte';
import Progress from './Progress.svelte';

describe('Progress', () => {
  it('is a progress bar named by its visible label, with the value written as a percentage', async () => {
    const { container } = render(Progress, { props: { label: 'Importing contract', value: 65 } });
    const bar = screen.getByRole<HTMLProgressElement>('progressbar', { name: 'Importing contract' });
    expect(bar.value).toBe(65);
    expect(bar.max).toBe(100);
    expect(screen.getByText('65%')).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('is indeterminate without a value', async () => {
    const { container } = render(Progress, { props: { label: 'Waiting for the broker' } });
    const bar = screen.getByRole('progressbar', { name: 'Waiting for the broker' });
    expect(bar.hasAttribute('value')).toBe(false);
    expect(screen.getByText('In progress')).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('rounds the percentage of a custom max', () => {
    render(Progress, { props: { label: 'Operations tested', value: 8, max: 12 } });
    expect(screen.getByText('67%')).toBeTruthy();
  });

  it('keeps a given id for the label', () => {
    render(Progress, { props: { label: 'Importing operations', value: 60, id: 'import-progress' } });
    expect(screen.getByRole('progressbar', { name: 'Importing operations' }).id).toBe('import-progress');
  });

  it('gives each progress its own id', () => {
    render(Progress, { props: { label: 'First', value: 1 } });
    render(Progress, { props: { label: 'Second', value: 2 } });
    expect(screen.getByRole('progressbar', { name: 'First' }).id).not.toBe(screen.getByRole('progressbar', { name: 'Second' }).id);
  });
});

describe('Meter', () => {
  it('is a meter named by its visible label, with the value written as value / max', async () => {
    const { container } = render(Meter, { props: { label: 'Operations passing', value: 11, max: 12 } });
    const meter = screen.getByRole<HTMLMeterElement>('meter', { name: 'Operations passing' });
    expect(meter.getAttribute('value')).toBe('11');
    expect(meter.getAttribute('min')).toBe('0');
    expect(meter.getAttribute('optimum')).toBe('12');
    expect(screen.getByText('11 / 12')).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('writes the given value text and keeps the range', () => {
    render(Meter, { props: { label: 'Latency', value: 140, min: 50, max: 500, low: 200, high: 350, optimum: 80, valueText: '140 ms' } });
    const meter = screen.getByRole('meter', { name: 'Latency' });
    expect(screen.getByText('140 ms')).toBeTruthy();
    expect(['min', 'max', 'low', 'high', 'optimum'].map((a) => meter.getAttribute(a))).toEqual(['50', '500', '200', '350', '80']);
  });
});
