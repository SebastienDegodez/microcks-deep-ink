import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import SectionLabel from './SectionLabel.svelte';

const html = (h: string) => createRawSnippet(() => ({ render: () => h }));

describe('SectionLabel', () => {
  it('renders the chosen element, keeps the text case and exposes size and weight', async () => {
    render(SectionLabel, { props: { as: 'h3', children: html('<span>Endpoints</span>') } });
    const { container } = render(SectionLabel, { props: { as: 'label', htmlFor: 'u', children: html('<span>Mock URL</span>') } });
    container.insertAdjacentHTML('beforeend', '<input id="u" value="https://mock">');
    render(SectionLabel, { props: { size: 'sm', weight: 'regular', split: true, children: html('<span><span>3 operations</span><span>calls · 7 d</span></span>') } });
    expect(screen.getByRole('heading', { level: 3, name: 'Endpoints' }).className).toBe('section-label');
    expect(screen.getByRole('textbox', { name: 'Mock URL' })).toBeTruthy();
    const caption = screen.getByText('3 operations').parentElement!.parentElement!;
    expect(caption.getAttribute('data-size')).toBe('sm');
    expect(caption.getAttribute('data-weight')).toBe('regular');
    expect(caption.hasAttribute('data-split')).toBe(true);
    expect(caption.hasAttribute('data-line-height')).toBe(false);
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it('exposes the line height option only when it is not the 16px default', () => {
    render(SectionLabel, { props: { as: 'h4', lineHeight: 'normal', children: html('<span>Request</span>') } });
    render(SectionLabel, { props: { size: 'sm', lineHeight: 'snug', children: html('<span>Skills</span>') } });
    expect(screen.getByRole('heading', { level: 4, name: 'Request' }).getAttribute('data-line-height')).toBe('normal');
    expect(screen.getByText('Skills').parentElement!.getAttribute('data-line-height')).toBe('snug');
  });
});
