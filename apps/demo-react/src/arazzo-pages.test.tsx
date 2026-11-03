import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { createComposition } from '@/composition-root';
import { UseCasesProvider } from '@/ui/app';
import { createTestRouter } from '@/ui/app/router';
import { resetPageFocusState } from '@/ui/app/usePageTitle';

function renderAt(path: string) {
  const { useCases, clock } = createComposition();
  const router = createTestRouter([path]);
  render(
    <UseCasesProvider useCases={useCases} clock={clock}>
      <RouterProvider router={router} />
    </UseCasesProvider>,
  );
  return router;
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
  });

  it('Workflow shows tabs with a roving tabindex and a Steps table with the same steps', async () => {
    renderAt('/workflows/pastry/restock-pastry/steps?run=14');
    expect(await screen.findByRole('heading', { level: 1, name: 'restock-pastry' })).toBeTruthy();
    const tabs = await screen.findAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(expect.arrayContaining(['Loom', 'Steps', 'Source', 'Mock URL', 'Sessions', 'Examples', 'Runs']));
    expect(tabs.filter((t) => t.getAttribute('tabindex') === '0')).toHaveLength(1);
    expect((await screen.findAllByText('patchPastry')).length).toBeGreaterThan(0);
  });

  it('Run setup validates the price and starts run 14 live', async () => {
    const router = renderAt('/workflows/pastry/restock-pastry/run?scenario=impl14');
    const price = await screen.findByLabelText(/newPrice/);
    fireEvent.change(price, { target: { value: '3,9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Use a dot as decimal separator');
    fireEvent.change(price, { target: { value: '3.9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/workflows\/runs\//));
  });

  it('Run page shows the failed run #14 with the link to test run 119', async () => {
    renderAt('/workflows/runs/6729a1d27e4c0b5f93a8c214');
    expect(await screen.findByRole('heading', { level: 1, name: 'Workflow run' })).toBeTruthy();
    expect(await screen.findByText(/Run #14 failed/)).toBeTruthy();
    const link = await screen.findByRole('link', { name: /test run #119/ });
    expect(link.getAttribute('href')).toContain('/tests/runner/119');
  });
});
