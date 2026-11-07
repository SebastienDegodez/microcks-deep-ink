import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import DescriptionList from './DescriptionList.svelte';

describe('DescriptionList', () => {
  it('pairs each term with its value in a native dl', async () => {
    const { container } = render(DescriptionList, {
      props: { items: [{ term: 'Service', value: 'API Pastry' }, { term: 'Version', value: '2.0', mono: true }] },
    });
    const terms = screen.getAllByRole('term');
    const values = screen.getAllByRole('definition');
    expect(terms.map((t) => t.textContent)).toEqual(['Service', 'Version']);
    expect(values.map((v) => v.textContent!.trim())).toEqual(['API Pastry', '2.0']);
    expect(values.map((v) => v.hasAttribute('data-mono'))).toEqual([false, true]);
    expect(container.querySelector('dl > div > dt + dd')).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('takes a snippet or a number as value, and the dl attributes', () => {
    const link = createRawSnippet(() => ({ render: () => '<a href="/services/1">API Pastry</a>' }));
    const { container } = render(DescriptionList, { props: { class: 'compact', 'aria-label': 'Facts', items: [{ term: 'Service', value: link }, { term: 'Examples', value: 3 }] } });
    expect(screen.getByRole('link', { name: 'API Pastry' }).closest('dd')).toBeTruthy();
    expect(screen.getByText('3').localName).toBe('dd');
    expect(container.querySelector('dl')!.className).toBe('dl compact');
  });
});
