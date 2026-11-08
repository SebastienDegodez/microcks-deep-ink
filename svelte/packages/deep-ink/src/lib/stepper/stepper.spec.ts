import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { axeViolations } from '../../../test/axe';
import Stepper from './Stepper.svelte';
describe('Stepper', () => {
  it('is a named ordered list, marking current and writing done', async () => {
    const { container } = render(Stepper, { label: 'Progress', steps: [{ label: 'Source', state: 'done' }, { label: 'Preview', state: 'current' }, { label: 'Live mock' }] });
    const list = screen.getByRole('list', { name: 'Progress' });
    const items = list.querySelectorAll('li');
    expect(items).toHaveLength(3);
    expect(items[0]?.textContent).toBe('1Source, done');
    expect(items[1]?.getAttribute('aria-current')).toBe('step');
    expect(items[2]?.hasAttribute('aria-current')).toBe(false);
    expect(await axeViolations(container)).toEqual([]);
  });
  it('supports vertical progress, custom numbers and completion word', () => {
    const { container } = render(Stepper, { direction: 'vertical', doneLabel: 'completed', steps: [{ id: 'source', label: 'Upload', n: 'A', state: 'done' }] });
    expect(container.querySelector('ol')?.getAttribute('data-direction')).toBe('vertical');
    expect(container.querySelector('li')?.textContent).toBe('AUpload, completed');
  });
  it('numbers instructions without progress states', async () => {
    const { container } = render(Stepper, { label: 'Before you paste', variant: 'list', steps: [{ label: 'Add the secret.', state: 'current' }, { label: 'Paste the job.' }] });
    expect(screen.getByRole('list', { name: 'Before you paste' }).getAttribute('data-variant')).toBe('list');
    expect(container.querySelector('.stepper-n')?.textContent).toBe('1.');
    expect(container.querySelector('[aria-current], [data-marker]')).toBeNull();
    expect(await axeViolations(container)).toEqual([]);
  });
  it('circle marker needs no list name; supports snippet labels and numbers', async () => {
    const { container } = render(Stepper, { variant: 'list', marker: 'circle', steps: [{ label: createRawSnippet(() => ({ render: () => '<span>checkMenu</span>' })), n: createRawSnippet(() => ({ render: () => '<span>1</span>' })) }] });
    expect(container.querySelector('ol')?.hasAttribute('aria-label')).toBe(false);
    expect(container.querySelector('ol')?.getAttribute('data-marker')).toBe('circle');
    expect(container.querySelector('.stepper-n')?.textContent).toBe('1');
    expect(container.querySelector('.stepper-n')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByText('checkMenu')).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });
});
