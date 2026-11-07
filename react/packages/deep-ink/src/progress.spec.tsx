import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../test/axe';
import { Meter, Progress } from './progress';

describe('Progress', () => {
  it('is a labelled native <progress> with the written percentage', async () => {
    const { container } = render(<Progress label="Upload" value={3} max={4} />);
    const bar = screen.getByRole('progressbar', { name: 'Upload' }) as HTMLProgressElement;
    expect(bar.value).toBe(3);
    expect(bar.max).toBe(4);
    expect(container.querySelector('.progress-value')!.textContent).toBe('75%');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('is indeterminate without a value', () => {
    const { container } = render(<Progress label="Import" />);
    expect(screen.getByRole('progressbar').hasAttribute('value')).toBe(false);
    expect(container.querySelector('.progress-value')!.textContent).toBe('In progress');
  });

  it('takes a translated indeterminate label', () => {
    const { container } = render(<Progress label="Import" indeterminateLabel="En cours" />);
    expect(container.querySelector('.progress-value')!.textContent).toBe('En cours');
  });
});

describe('Meter', () => {
  it('is a labelled native <meter> with a written value', async () => {
    const { container } = render(<Meter label="Conformance" value={11} max={12} valueText="11 of 12" />);
    const meter = screen.getByRole('meter', { name: 'Conformance' }) as HTMLMeterElement;
    expect(meter.value).toBe(11);
    expect(meter.optimum).toBe(12);
    expect(container.querySelector('.progress-value')!.textContent).toBe('11 of 12');
    expect(await axeViolations(container)).toEqual([]);
  });
});
