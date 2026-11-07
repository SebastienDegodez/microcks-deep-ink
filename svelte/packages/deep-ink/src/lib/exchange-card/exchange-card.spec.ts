import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import ExchangeHarness from '../../../test/fixtures/ExchangeHarness.svelte';
import Exchange from './Exchange.svelte';
import ExchangeCard from './ExchangeCard.svelte';

describe('ExchangeCard', () => {
  it('names each card and block, writes the status and hides the separator', async () => {
    const { container } = render(ExchangeHarness);
    const req = screen.getByRole('region', { name: 'Request of Eclair Cafe' });
    expect(req.querySelectorAll('pre')).toHaveLength(2);
    expect(screen.getByRole('region', { name: 'Parameters' }).getAttribute('data-tone')).toBe('params');
    expect(screen.getByRole('region', { name: 'Response body' }).tabIndex).toBe(0);
    expect(screen.getByText('404 Not Found').getAttribute('data-tone')).toBe('warning');
    expect(screen.getByRole('heading', { level: 4, name: 'Response' })).toBeTruthy();
    expect(container.querySelector('.exchange-sep')?.getAttribute('aria-hidden')).toBe('true');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('takes snippet meta and status, a span title and the small size; Exchange can drop the separator', async () => {
    const html = (h: string) => createRawSnippet(() => ({ render: () => h }));
    const card = render(ExchangeCard, {
      props: { title: 'Request', label: 'Request', headingLevel: 'none', size: 'sm', meta: html('<em>Eclair</em>'), status: html('<b>200 OK</b>'), blocks: [{ label: 'Body', text: 'x' }] },
    });
    expect(screen.queryByRole('heading')).toBeNull();
    expect(card.container.querySelector('section')!.dataset.size).toBe('sm');
    expect(card.container.querySelector('.exchange-card-meta em')!.textContent).toBe('Eclair');
    expect(card.container.querySelector('.exchange-card-status')!.hasAttribute('data-tone')).toBe(false);
    expect(await axeViolations(card.container)).toEqual([]);
    const pair = render(Exchange, { props: { separator: false, children: ['A', 'B'] } });
    expect(pair.container.querySelector('.exchange')!.textContent).toBe('AB');
  });
});
