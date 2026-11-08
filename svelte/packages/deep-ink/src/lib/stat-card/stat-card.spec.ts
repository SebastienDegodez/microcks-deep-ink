import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import StatCard from './StatCard.svelte';
import StatGrid from './StatGrid.svelte';
const html = (s: string) => createRawSnippet(() => ({ render: () => s }));
describe('StatCard', () => {
  it('is a region labelled by its heading and keeps figures textual', async () => {
    const { container } = render(StatCard, { props: { title: 'Average conformance', value: '78%', unit: 'current score', tone: 'warning', children: html('<p>Across 8 tested services</p>') } });
    expect(screen.getByRole('region', { name: 'Average conformance' }).getAttribute('data-tone')).toBe('warning');
    expect(screen.getByRole('heading', { level: 2, name: 'Average conformance' })).toBeTruthy();
    expect(screen.getByText('78%').closest('p')?.textContent).toBe('78%current score');
    expect(await axeViolations(container)).toEqual([]);
  });
  it('names stat grid regions', () => {
    const { container } = render(StatGrid, { props: { label: 'Key figures' } });
    expect(container.querySelector('section')?.getAttribute('aria-label')).toBe('Key figures');
  });
});
