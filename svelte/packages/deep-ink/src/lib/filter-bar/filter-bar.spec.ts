import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import FilterBar from './FilterBar.svelte';
import FilterSearch from './FilterSearch.svelte';
import FilterReset from './FilterReset.svelte';
const html = (s: string) => createRawSnippet(() => ({ render: () => s }));
describe('FilterBar', () => {
  it('names the search and titled filter groups and forwards reset activation', async () => {
    const { container } = render(FilterBar, { props: { label: 'Catalogue filters', children: html('<div class="filter-bar-row"><label class="filter-bar-search"><span class="sr-only">Search APIs and services</span><input type="search" aria-label="Search APIs and services" /></label></div><div class="filter-bar-row" role="group" aria-label="Protocol"><button type="button">REST</button></div>') } });
    expect(container.querySelector('section')?.getAttribute('aria-label')).toBe('Catalogue filters');
    render(FilterSearch, { props: { label: 'Search APIs and services' } });
    expect(screen.getAllByRole('searchbox', { name: 'Search APIs and services' })).toHaveLength(2);
    const onClick = vi.fn(); render(FilterReset, { props: { count: 1, onclick: onClick } }); await fireEvent.click(screen.getByRole('button', { name: 'Reset (1)' })); expect(onClick).toHaveBeenCalledOnce();
    expect(await axeViolations(container)).toEqual([]);
  });
  it('disables reset when count is zero', () => {
    render(FilterReset, { props: { count: 0 } }); expect((screen.getByRole('button', { name: 'Reset (0)' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
