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
  return render(App, { props: { useCases, clock, router } });
}

beforeEach(() => {
  resetPageFocusState();
  document.title = '';
});

const h1 = (name: string | RegExp) => screen.findByRole('heading', { level: 1, name });

describe('explore pages', () => {
  it('Cockpit: KPIs, protocol filter chips, Needs attention with #119 and the live pause button', async () => {
    renderAt('/');
    await h1('Cockpit');
    expect(await screen.findByRole('heading', { level: 2, name: 'Needs attention' })).toBeTruthy();
    expect(screen.getAllByText(/Test #119/).length).toBeGreaterThan(0);
    const chip = screen.getByRole('button', { name: /^EVENT 2/ });
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    await fireEvent.click(chip);
    expect(screen.getByRole('button', { name: /^EVENT 2/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(/of 11 services/)).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByRole('button', { name: 'Resume' }).getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(document.title).toBe('Cockpit · Microcks'));
  });

  it('Cockpit: the empty install shows the getting-started checklist', async () => {
    renderAt('/');
    await h1('Cockpit');
    await fireEvent.click(await screen.findByRole('button', { name: 'Show empty install' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Getting started' })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Mark step 1 as done' }));
    expect(screen.getByText('1 of 3 done')).toBeTruthy();
  });

  it('Catalogue: shows 11 services, filters by status and resets', async () => {
    renderAt('/services');
    await h1('APIs & Services');
    await screen.findByRole('link', { name: 'Open API Pastry 2.0' });
    expect(screen.getByTestId('result-count').textContent).toContain('11 of 11');
    await fireEvent.click(screen.getByRole('button', { name: /^Failing/ }));
    await waitFor(() => expect(screen.getByTestId('result-count').textContent).toContain('5 of 11'));
    await fireEvent.input(screen.getByRole('searchbox', { name: 'Filter by name' }), { target: { value: 'zzz' } });
    expect(await screen.findByRole('heading', { level: 2, name: 'No API matches these filters' })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    await waitFor(() => expect(screen.getByTestId('result-count').textContent).toContain('11 of 11'));
  });

  it('Catalogue: the Direct API button link navigates to the new source page', async () => {
    renderAt('/services');
    await h1('APIs & Services');
    await fireEvent.click(screen.getByRole('link', { name: 'Direct API' }));
    await waitFor(() => expect(window.location.hash).toBe('#/sources/new'));
  });

  it('Service: operations tab with the AI proposal, then properties and tests tabs', async () => {
    renderAt('/services/pastry2/operations');
    // The h1 is the api-badge: "REST API Pastry 2.0".
    await h1(/^REST\s+API Pastry 2\.0$/);
    expect(screen.getByRole('heading', { level: 3, name: 'Used in 4 workflows' })).toBeTruthy();
    const dispatch = screen.getByRole('link', { name: 'Edit behavior' }).closest('.summary-strip') as HTMLElement;
    expect(dispatch.getAttribute('data-line-height')).toBe('inherit');
    expect(dispatch.getAttribute('data-gap')).toBe('roomy');
    expect(dispatch.querySelectorAll('.summary-strip-sep[aria-hidden="true"]')).toHaveLength(1);
    await screen.findByRole('button', { name: /Accept Tartelette Framboise/ });
    expect(screen.getByRole('button', { name: /Accept Tartelette Framboise/ })).toBeTruthy();
    await fireEvent.click(screen.getByRole('tab', { name: /Tests/ }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Latest test runs' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /#119/ })).toBeTruthy();
    await fireEvent.click(screen.getByRole('tab', { name: 'Properties & MCP' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Agent-ready' })).toBeTruthy();
  });
});
