import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Workflow screen', () => {
  it('Workflow shows tabs with a roving tabindex and a Steps table with the same steps', async () => {
    renderAt('/workflows/pastry/restock-pastry/steps?run=14');
    expect(await screen.findByRole('heading', { level: 1, name: /Restock a pastry/ })).toBeTruthy();
    const tabs = await screen.findAllByRole('tab');
    for (const name of ['Loom', 'Steps', 'Source', 'Mock URL', 'Sessions', 'Examples', 'Runs']) expect(screen.getByRole('tab', { name: new RegExp(`^${name}`) })).toBeTruthy();
    expect(screen.getByRole('note').textContent).toContain('Run #14 · step 3, patchPastry, failed after 3 attempts');
    expect(tabs.filter((t) => t.getAttribute('tabindex') === '0')).toHaveLength(1);
    expect((await screen.findAllByText('patchPastry')).length).toBeGreaterThan(0);
  });

  it('selects the run of ?run= and the step of ?step=, and closes the inspector', async () => {
    const { router } = renderAt('/workflows/pastry/restock-pastry/loom?run=13&step=patchPastry');
    const picked = await screen.findByRole('button', { name: /^#13\s*Session, failed$/ });
    expect(picked.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /^#14\s*Implementations/ }).getAttribute('aria-pressed')).toBe('false');
    expect((await screen.findByRole('heading', { level: 2, name: /patchPastry/ })).id).toBe('wf-ins-title');
    await fireEvent.click(screen.getByRole('button', { name: /^#12\s*Mocks/ }));
    expect(new URLSearchParams(router.location.search).get('run')).toBe('12');
    expect(new URLSearchParams(router.location.search).get('step')).toBe('patchPastry');
    await fireEvent.click(screen.getByRole('button', { name: 'Close step inspector' }));
    await waitFor(() => expect(router.location.search).toBe('?run=12'));
    expect(screen.queryByRole('button', { name: 'Close step inspector' })).toBeNull();
  });

  it('sends a tab segment that is not a tab back to the Loom, replacing the entry', async () => {
    const { router } = renderAt('/workflows/pastry/restock-pastry/nope');
    const length = window.history.length;
    await waitFor(() => expect(router.location.pathname).toBe('/workflows/pastry/restock-pastry/loom'));
    expect(window.history.length).toBe(length);
    expect((await screen.findByRole('tab', { name: /^Loom/ })).getAttribute('aria-selected')).toBe('true');
  });

  it('keeps the run number only for the Loom and Steps tabs', async () => {
    const { router } = renderAt('/workflows/pastry/restock-pastry/loom?run=13');
    await fireEvent.click(await screen.findByRole('tab', { name: /^Steps/ }));
    await waitFor(() => expect(router.location.pathname).toBe('/workflows/pastry/restock-pastry/steps'));
    expect(router.location.search).toBe('?run=13');
    await fireEvent.click(screen.getByRole('tab', { name: /^Source/ }));
    await waitFor(() => expect(router.location.pathname).toBe('/workflows/pastry/restock-pastry/source'));
    expect(router.location.search).toBe('');
    await fireEvent.click(screen.getByRole('tab', { name: /^Loom/ }));
    await waitFor(() => expect(router.location.pathname).toBe('/workflows/pastry/restock-pastry/loom'));
    expect(router.location.search).toBe('?run=14');
  });

  it('copies the Mock URL of the workflow', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    renderAt('/workflows/pastry/restock-pastry/mock-url');
    const copy = await screen.findByRole('button', { name: 'Copy the Mock URL of restock-pastry' });
    await fireEvent.click(copy);
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('restock-pastry'));
    await waitFor(() => expect(copy.textContent).toBe('Copied'));
  });
});
