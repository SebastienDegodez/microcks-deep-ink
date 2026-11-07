import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import FactsHarness from '../../../test/fixtures/FactsHarness.svelte';
import Facts from './Facts.svelte';

const dls = () => Array.from(document.querySelectorAll('dl'));

describe('Facts', () => {
  it('pairs each term with its value in a dl, with layout, mono, tone and sub', async () => {
    const { container } = render(FactsHarness);
    const [rows, cols] = dls();
    expect(rows!.querySelectorAll('.facts-row > dt')).toHaveLength(3);
    expect(rows!.style.getPropertyValue('--facts-term')).toBe('150px');
    expect(screen.getByText('Creates or updates Services').className).toBe('facts-sub');
    expect(screen.getByText('Primary · OPEN_API_SPEC').closest('dd')?.hasAttribute('data-mono')).toBe(true);
    expect(cols!.getAttribute('data-layout')).toBe('columns');
    expect(cols!.style.getPropertyValue('--facts-cols')).toBe('repeat(3, minmax(0, 1fr))');
    expect(screen.getByText('Failed').getAttribute('data-tone')).toBe('danger');
    expect(screen.getByRole('link', { name: 'Usage details' })).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('boxes on the surface and takes a custom gap', () => {
    const { container } = render(Facts, { props: { layout: 'inline', boxed: 'surface', gap: '9px 12px', items: [{ term: 'Workflow', value: 'restock-pastry' }] } });
    const dl = container.querySelector('dl')!;
    expect(dl.getAttribute('data-boxed')).toBe('surface');
    expect(dl.style.getPropertyValue('--facts-gap')).toBe('9px 12px');
  });

  it('sizes', () => {
    render(Facts, { props: { layout: 'columns', size: 'sm', items: [{ term: 'Client', value: 'microcks-arazzo' }] } });
    render(Facts, { props: { size: 'lg', items: [{ term: 'Mock URL', value: 'https://microcks.acme.io/rest/API+Pastry/2.0', mono: true }] } });
    render(Facts, { props: { items: [{ term: 'Owner', value: 'MA' }] } });
    const all = dls();
    expect(all[0]!.getAttribute('data-size')).toBe('sm');
    expect(all[1]!.getAttribute('data-size')).toBe('lg');
    expect(all[2]!.hasAttribute('data-size')).toBe(false);
  });
});

describe('Facts values and line height', () => {
  it('exposes secondary values and a relaxed line height only when asked', async () => {
    render(Facts, {
      props: { layout: 'inline', boxed: true, values: 'secondary', lineHeight: 'relaxed', termWidth: '120px', items: [{ term: 'Method', value: 'tasks/cancel', mono: true }, { term: 'Retries', value: 'none', mono: true, tone: 'muted' }] },
    });
    render(Facts, { props: { items: [{ term: 'Version', value: '2.0' }] } });
    const [custom, plain] = dls();
    expect(custom!.getAttribute('data-values')).toBe('secondary');
    expect(custom!.getAttribute('data-line-height')).toBe('relaxed');
    expect(plain!.hasAttribute('data-values')).toBe(false);
    expect(plain!.hasAttribute('data-line-height')).toBe(false);
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe('Facts size', () => {
  it('has a large rows size', () => {
    const { container } = render(Facts, { props: { size: 'lg', termWidth: '150px', items: [{ term: 'Version', value: '2.0', mono: true }] } });
    expect(container.querySelector('dl')?.getAttribute('data-size')).toBe('lg');
  });
});

describe('Facts request body variant', () => {
  it('boxes compact, mono and pre-wrapped, keeping the dl terms and values', async () => {
    render(Facts, {
      props: {
        layout: 'inline', boxed: 'compact', mono: true, wrap: 'pre', termWidth: '32ch', gap: '2px 0',
        items: [{ term: 'pastryName', value: 'Eclair Cafe' }, { term: 'note', value: 'Restock before 7am.\nKeep the cold chain.' }],
      },
    });
    render(Facts, { props: { items: [{ term: 'Version', value: '2.0' }] } });
    const [body, plain] = dls();
    expect(body!.getAttribute('data-boxed')).toBe('compact');
    expect(body!.hasAttribute('data-mono')).toBe(true);
    expect(body!.getAttribute('data-wrap')).toBe('pre');
    expect(body!.style.getPropertyValue('--facts-term')).toBe('32ch');
    expect(body!.style.getPropertyValue('--facts-gap')).toBe('2px 0');
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['pastryName', 'note', 'Version']);
    expect(screen.getAllByRole('definition')[1]!.textContent).toBe('Restock before 7am.\nKeep the cold chain.');
    expect(plain!.hasAttribute('data-mono')).toBe(false);
    expect(plain!.hasAttribute('data-wrap')).toBe(false);
    expect(plain!.hasAttribute('data-boxed')).toBe(false);
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
