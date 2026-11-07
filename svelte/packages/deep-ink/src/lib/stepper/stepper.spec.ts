import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Stepper from './Stepper.svelte';

describe('Stepper', () => {
  it('is a named ordered list with the current step marked and done steps written', async () => {
    render(Stepper, { props: { label: 'Progress', steps: [{ label: 'Source', state: 'done' }, { label: 'Preview', state: 'current' }, { label: 'Live mock' }] } });
    render(Stepper, { props: { label: 'Before you paste', variant: 'list', steps: [{ label: 'Add the secret.' }, { label: 'Paste the job.' }] } });
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
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it('circle marker: the number without a dot, the list name optional', async () => {
    const label = createRawSnippet(() => ({ render: () => '<span><span class="sr-only">Step 1: </span>checkMenu</span>' }));
    const { container } = render(Stepper, { props: { variant: 'list', marker: 'circle', steps: [{ label }, { label: 'orderPastry' }] } });
    const ol = container.querySelector('ol')!;
    expect(ol.hasAttribute('aria-label')).toBe(false);
    expect(ol.getAttribute('data-marker')).toBe('circle');
    expect(ol.querySelector('.stepper-n')?.textContent).toBe('1');
    expect(ol.querySelector('.stepper-n')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByText('Step 1:').className).toBe('sr-only');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('shows a custom number and done label, and stacks the steps', () => {
    render(Stepper, { props: { label: 'Import', direction: 'vertical', doneLabel: 'terminé', steps: [{ label: 'One', state: 'done', n: 'A' }] } });
    const list = screen.getByRole('list', { name: 'Import' });
    expect([list.getAttribute('data-direction'), list.querySelector('li')!.textContent]).toEqual(['vertical', 'AOne, terminé']);
  });
});
