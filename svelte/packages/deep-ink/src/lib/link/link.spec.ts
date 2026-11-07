import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Link from './Link.svelte';

const text = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Link', () => {
  it('is a link named by its text, reached with Tab and followed with Enter', async () => {
    const user = userEvent.setup();
    const onclick = vi.fn((e: Event) => e.preventDefault());
    const { container } = render(Link, { props: { href: '/docs/dispatchers', onclick, children: text('Dispatcher guide') } });
    const link = screen.getByRole('link', { name: 'Dispatcher guide' });
    expect(link.getAttribute('href')).toBe('/docs/dispatchers');
    expect(link.hasAttribute('target')).toBe(false);
    await user.tab();
    expect(document.activeElement).toBe(link);
    await user.keyboard('{Enter}');
    expect(onclick).toHaveBeenCalledOnce();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('announces an external link as opening in a new tab', async () => {
    const { container } = render(Link, { props: { href: 'https://microcks.io', external: true, rel: 'author', target: '_self', children: text('Microcks documentation') } });
    const link = screen.getByRole('link', { name: 'Microcks documentation (opens in a new tab)' });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('keeps target and rel when not external, and calls onfocus and onblur', async () => {
    const user = userEvent.setup();
    const onfocus = vi.fn();
    const onblur = vi.fn();
    render(Link, { props: { href: '#docs', target: '_top', rel: 'help', class: 'strong', onfocus, onblur, children: text('Docs') } });
    const link = screen.getByRole('link', { name: 'Docs' });
    expect([link.getAttribute('target'), link.getAttribute('rel'), link.className]).toEqual(['_top', 'help', 'link strong']);
    await user.tab();
    await user.tab();
    expect([onfocus.mock.calls.length, onblur.mock.calls.length]).toEqual([1, 1]);
  });
});
