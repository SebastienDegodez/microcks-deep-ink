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
  return router;
}

const RUN_14 = '/workflows/runs/6729a1d27e4c0b5f93a8c214';

beforeEach(() => {
  resetPageFocusState();
  document.title = '';
});

describe('Workflow run setup', () => {
  it('Run setup validates the price and starts run 14 live', async () => {
    const router = renderAt('/workflows/pastry/restock-pastry/run?scenario=impl14');
    const price = await screen.findByLabelText(/newPrice/);
    await fireEvent.input(price, { target: { value: '3,9' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Use a dot as decimal separator');
    await fireEvent.input(price, { target: { value: '3.9' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    await waitFor(() => expect(router.location.pathname).toMatch(/^\/workflows\/runs\//));
  });

  it('prefills the implementations preset with its base URL, secret and example', async () => {
    renderAt('/workflows/pastry/restock-pastry/run?scenario=impl14');
    expect((await screen.findByRole<HTMLInputElement>('radio', { name: 'Implementations' })).checked).toBe(true);
    expect(screen.getByRole('textbox', { name: /Base URL of the implementation/ })).toBeTruthy();
    expect(screen.getByRole<HTMLSelectElement>('combobox', { name: 'Secret' }).value).toBe('pastry-staging-oauth');
    expect(screen.getByRole<HTMLSelectElement>('combobox', { name: 'Example' }).value).toBe('restock-eclair');
  });

  it('prefills the mocks preset without base URL and switches to the implementations on demand', async () => {
    renderAt('/workflows/pastry/restock-pastry/run?scenario=mocksEnd');
    const mocks = await screen.findByRole<HTMLInputElement>('radio', { name: 'Microcks mocks' });
    expect(mocks.checked).toBe(true);
    expect(screen.getByRole<HTMLSelectElement>('combobox', { name: 'Example' }).value).toBe('already-available');
    expect(screen.queryByRole('textbox', { name: /Base URL of the implementation/ })).toBeNull();
    await fireEvent.click(screen.getByRole('radio', { name: 'Implementations' }));
    expect(await screen.findByRole('textbox', { name: /Base URL of the implementation/ })).toBeTruthy();
  });
});

describe('Workflow run', () => {
  it('Run page shows the failed run #14 with the link to test run 119', async () => {
    renderAt(RUN_14);
    expect(await screen.findByRole('heading', { level: 1, name: 'Run #14' })).toBeTruthy();
    expect(await screen.findByRole('heading', { level: 2, name: 'Run failed' })).toBeTruthy();
    expect((await screen.findAllByText('Stops at patchPastry')).length).toBeGreaterThan(0);
    const link = await screen.findByRole('link', { name: /test run #119/ });
    expect(link.getAttribute('href')).toContain('/tests/runner/119');
    await waitFor(() => expect(document.title).toBe('Workflow run · Microcks'));
  });

  it('marks the current scenario and opens another one from the scenario bar', async () => {
    const router = renderAt(RUN_14);
    const current = await screen.findByRole('link', { name: 'Implementations #14' });
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Run again' }).getAttribute('href')).toBe('#/workflows/pastry/restock-pastry/run?scenario=impl14');
    await fireEvent.click(screen.getByRole('link', { name: 'Mocks · ended early' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Run #15' })).toBeTruthy();
    expect(router.location.pathname).toBe('/workflows/runs/6729a3f08b1d6e2c45f7a930');
    expect(screen.getByRole('link', { name: 'Mocks · ended early' }).getAttribute('aria-current')).toBe('page');
  });

  it('pauses a live run, then skips to its result', async () => {
    const router = renderAt(`${RUN_14}?live`);
    const pause = await screen.findByRole('button', { name: 'Pause updates' });
    expect(pause.getAttribute('aria-pressed')).toBe('false');
    await fireEvent.click(pause);
    expect(screen.getByRole('button', { name: 'Resume updates' }).getAttribute('aria-pressed')).toBe('true');
    await fireEvent.click(screen.getByRole('link', { name: 'Skip to result' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Run failed' })).toBeTruthy();
    expect(router.location.search).toBe('');
    expect(screen.queryByRole('button', { name: /updates$/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'Replay live' })).toBeTruthy();
  });
});
