import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { createComposition } from '@/composition-root';
import App from '@/ui/app/App.svelte';
import { resetPageFocusState } from '@/ui/app/page-title.svelte.js';
import { createAppRouter } from '@/ui/app/routes';

function renderAt(path: string) {
  window.history.replaceState(null, '', `#${path}`);
  const { useCases, clock } = createComposition();
  const router = createAppRouter();
  render(App, { props: { useCases, clock, router } });
  return { router, useCases };
}

beforeEach(() => {
  resetPageFocusState();
  document.title = '';
});

describe('Arazzo screens', () => {
  it('Workflows lists the workflows with one h1', async () => {
    renderAt('/workflows');
    expect(await screen.findByRole('heading', { level: 1, name: /workflows/i })).toBeTruthy();
    expect((await screen.findAllByText('restock-pastry')).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('link', { name: /^Run\s*restock-pastry$/ }).getAttribute('href')).toBe('#/workflows/pastry/restock-pastry/run');
  });

  it('filters by workflow id and resets an empty result', async () => {
    renderAt('/workflows');
    await screen.findAllByText('restock-pastry');
    const search = screen.getByRole('searchbox', { name: 'Filter workflows' });
    await fireEvent.input(search, { target: { value: 'compare-prices' } });
    await waitFor(() => expect(screen.queryByText('restock-pastry')).toBeNull());
    expect(screen.getAllByText('compare-prices').length).toBeGreaterThan(0);
    await fireEvent.input(search, { target: { value: 'missing-workflow' } });
    expect(await screen.findByRole('heading', { name: 'No workflow matches these filters' })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect((await screen.findAllByText('restock-pastry')).length).toBeGreaterThan(0);
    expect((search as HTMLInputElement).value).toBe('');
  });

  it('links an unresolved source through the workspace radio group and refreshes the workflows', async () => {
    const { useCases } = renderAt('/workflows');
    await fireEvent.click(await screen.findByRole('button', { name: 'Link sources' }));
    const radio = (await screen.findAllByRole<HTMLInputElement>('radio'))[0]!;
    const serviceId = radio.value;
    await fireEvent.click(radio);
    await fireEvent.click(screen.getByRole('button', { name: 'Link this API' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const document = (await useCases.arazzo.listDocuments()).find((d) => d.id === 'beer');
    expect(document?.sources.find((s) => s.name === 'beerCatalog')?.link).toMatchObject({ status: 'linked', serviceId });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Link sources' })).toBeNull());
    expect(screen.getByRole('link', { name: /^Run\s*checkout-beer$/ })).toBeTruthy();
    expect(screen.getByText('5 workflows · 2 Arazzo documents · 4 source descriptions (0 not linked)')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /beerCatalog · not linked/ })).toBeNull();
  });

  it('shows loading and empty-install states, then restores the list', async () => {
    renderAt('/workflows');
    await screen.findAllByText('restock-pastry');
    await fireEvent.click(screen.getByRole('button', { name: 'Show loading' }));
    expect(screen.getByRole('region', { name: 'Loading workflows' }).getAttribute('aria-busy')).toBe('true');
    await fireEvent.click(screen.getByRole('button', { name: 'Show empty state' }));
    expect(screen.getByRole('heading', { name: 'Bring your API workflows into Microcks' })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Show empty state' }));
    expect((await screen.findAllByText('restock-pastry')).length).toBeGreaterThan(0);
  });
});
