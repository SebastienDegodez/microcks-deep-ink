import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import StatGridHarness from '../../../test/fixtures/StatGridHarness.svelte';
import StatCard from './StatCard.svelte';

describe('StatCard', () => {
  it('is a region named by its heading, with the figure as text', async () => {
    const { container } = render(StatGridHarness);
    expect(screen.getByRole('region', { name: 'Key figures' })).toBeTruthy();
    const card = screen.getByRole('region', { name: 'Average conformance' });
    expect(card.getAttribute('data-tone')).toBe('warning');
    expect(screen.getByRole('heading', { level: 2, name: 'APIs & services' })).toBeTruthy();
    expect(screen.getByText('78%').closest('p')?.textContent).toBe('78%current score');
    expect(screen.getByRole('link', { name: 'Catalogue' }).parentElement!.className).toBe('stat-card-action');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('keeps its heading name over aria-labelledby and renders a number value without unit, action nor body', () => {
    const { container } = render(StatCard, { props: { title: 'Services', value: 11, headingLevel: 4, 'aria-labelledby': 'outer' } });
    expect(screen.getByRole('region', { name: 'Services' }).getAttribute('data-tone')).toBe('neutral');
    expect(screen.getByRole('heading', { level: 4, name: 'Services' })).toBeTruthy();
    expect(container.querySelector('.stat-card-figure')!.innerHTML.replace(/<!---->/g, '')).toBe('<span class="stat-card-value">11</span>');
    expect(container.querySelector('.stat-card-action, .stat-card-unit, .stat-card-body')).toBeNull();
  });
});
