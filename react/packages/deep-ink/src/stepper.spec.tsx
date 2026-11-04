import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../test/axe';
import { Stepper } from './stepper';

describe('Stepper', () => {
  it('is a named ordered list with the current step marked and done steps written', async () => {
    const { container } = render(
      <div>
        <Stepper label="Progress" steps={[{ label: 'Source', state: 'done' }, { label: 'Preview', state: 'current' }, { label: 'Live mock' }]} />
        <Stepper label="Before you paste" variant="list" steps={[{ label: 'Add the secret.' }, { label: 'Paste the job.' }]} />
      </div>,
    );
    const progress = screen.getByRole('list', { name: 'Progress' });
    const items = progress.querySelectorAll('li');
    expect(items).toHaveLength(3);
    expect(items[0]!.textContent).toBe('1Source, done');
    expect(items[1]!.getAttribute('aria-current')).toBe('step');
    expect(items[2]!.hasAttribute('aria-current')).toBe(false);
    const list = screen.getByRole('list', { name: 'Before you paste' });
    expect(list.getAttribute('data-variant')).toBe('list');
    expect(list.querySelector('.stepper-n')?.textContent).toBe('1.');
    expect(list.hasAttribute('data-marker')).toBe(false);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('circle marker: the number without a dot, the list name optional', async () => {
    const { container } = render(
      <section aria-labelledby="plan-h">
        <h2 id="plan-h">Plan</h2>
        <Stepper variant="list" marker="circle" steps={[{ label: <><span className="sr-only">Step 1: </span>checkMenu</> }, { label: 'orderPastry' }]} />
      </section>,
    );
    const ol = container.querySelector('ol')!;
    expect(ol.hasAttribute('aria-label')).toBe(false);
    expect(ol.getAttribute('data-marker')).toBe('circle');
    expect(ol.querySelector('.stepper-n')?.textContent).toBe('1');
    expect(ol.querySelector('.stepper-n')?.getAttribute('aria-hidden')).toBe('true');
    expect(await axeViolations(container)).toEqual([]);
  });
});
