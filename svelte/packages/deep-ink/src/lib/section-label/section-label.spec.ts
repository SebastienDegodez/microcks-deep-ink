import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import SectionLabel from './SectionLabel.svelte';
const html = (s: string) => createRawSnippet(() => ({ render: () => s }));
describe('SectionLabel', () => {
  it('renders selected semantics and class hooks', async () => {
    const { container } = render(SectionLabel, { props: { as: 'h3', children: html('Endpoints') } });
    expect(screen.getByRole('heading', { level: 3, name: 'Endpoints' }).className).toBe('section-label');
    render(SectionLabel, { props: { as: 'label', htmlFor: 'url', children: html('Mock URL') } });
    expect(screen.getByText('Mock URL').getAttribute('for')).toBe('url');
    expect(await axeViolations(container)).toEqual([]);
  });
  it('only writes non-default line height', () => {
    const { container } = render(SectionLabel, { props: { size: 'sm', weight: 'regular', split: true, lineHeight: 'snug', children: html('Skills') } });
    const el = container.querySelector('.section-label') as HTMLElement; expect(el.dataset.lineHeight).toBe('snug'); expect(el.dataset.size).toBe('sm'); expect(el.hasAttribute('data-split')).toBe(true);
  });
});
