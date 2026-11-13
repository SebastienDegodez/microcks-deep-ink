import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import RunProgress from './RunProgress.svelte';
import Fixture from './_Fixture.svelte';
/** The non-empty text nodes that are direct children of `el`. */
const texts = (el: Element) => [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent !== '').map((n) => n.textContent);
describe('RunProgress', () => {
  it('names the section/bar, writes counts and announces the current step outside busy content', async () => {
    const { container } = render(Fixture);
    expect(screen.getByRole('region', { name: 'Progress' }).hasAttribute('aria-busy')).toBe(false);
    expect(screen.getByRole('img', { name: '5 of 7 test steps done' }).children).toHaveLength(7);
    expect(screen.getByText('PATCH /pastries/{name}').closest('[aria-live]')?.getAttribute('aria-live')).toBe('polite');
    expect(screen.getByText('1 failed')).toBeTruthy();
    const note = screen.getByText('Paused: the run waits for Step forward.');
    expect(note.compareDocumentPosition(screen.getByRole('button', { name: 'Step forward' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });
  it('overrides aria-label, preserves styles with gap, and updates busy/current props', async () => {
    const { container, rerender } = render(RunProgress, { label: 'Run #120 progress', 'aria-label': 'Ignored', busy: true, done: 1, total: 3, caption: 'steps done', now: 'GET /pastries', gap: 3, style: 'color: red', segments: ['done', 'current', 'queued'] });
    const region = screen.getByRole('region', { name: 'Run #120 progress' });
    expect(region.hasAttribute('aria-busy')).toBe(false);
    expect((region as HTMLElement).style.getPropertyValue('--run-gap')).toBe('3px');
    expect((region as HTMLElement).style.color).toBe('red');
    expect(screen.getByRole('img').getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('GET /pastries').closest('[aria-busy]')).toBeNull();
    expect(await axeViolations(container)).toEqual([]);
    await rerender({ busy: false, now: undefined, counts: [] });
    expect(container.querySelector('[aria-busy], [aria-live], .run-progress-foot')).toBeNull();
  });
  it('writes the total as "/" then the number', () => {
    const { container } = render(Fixture);
    expect(texts(container.querySelector('.run-progress-total')!)).toEqual(['/', '7']);
  });
  it('leaves no layout whitespace between its parts, as the twin', () => {
    const { container } = render(Fixture);
    expect(container.querySelector('.run-progress')?.textContent).toBe(
      '5/7test steps doneNow callingPATCH /pastries/{name}Paused: the run waits for Step forward.4 passed1 failedStep forward',
    );
  });
});
