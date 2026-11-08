import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Facts from './Facts.svelte';
const html = (s: string) => createRawSnippet(() => ({ render: () => s }));
describe('Facts', () => {
  it('pairs terms and values in dl rows with options and rich children', async () => {
    const { container } = render(Facts, { props: { termWidth: '150px', items: [{ term: 'Origin', value: 'GitLab repository' }, { term: 'Artifact', value: 'Primary · OPEN_API_SPEC', sub: 'Creates or updates Services', mono: true }], children: html('<div class="facts-row"><dt>Statistics</dt><dd><a href="#/usage">Usage details</a></dd></div>') } });
    const dl = container.querySelector('dl')!;
    expect(dl.querySelectorAll('.facts-row > dt')).toHaveLength(3);
    expect(dl.style.getPropertyValue('--facts-term')).toBe('150px');
    expect(screen.getByText('Creates or updates Services').className).toBe('facts-sub');
    expect(screen.getByText('Primary · OPEN_API_SPEC').closest('dd')?.hasAttribute('data-mono')).toBe(true);
    expect(await axeViolations(container)).toEqual([]);
  });
  it('sets custom boxed layout variables and supports compact pre-wrapped facts', () => {
    const { container } = render(Facts, { props: { layout: 'inline', boxed: 'compact', mono: true, wrap: 'pre', gap: '2px 0', items: [{ term: 'note', value: 'Restock\nKeep cool' }] } });
    const dl = container.querySelector('dl')!; expect(dl.dataset.boxed).toBe('compact'); expect(dl.dataset.mono).toBe(''); expect(dl.dataset.wrap).toBe('pre');
    expect(dl.style.getPropertyValue('--facts-gap')).toBe('2px 0');
    expect(screen.getByText('note')).toBeTruthy();
  });
});
