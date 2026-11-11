import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
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

  it('Behavior: simulates a call and warns when a change is unsaved', async () => {
    renderAt('/services/pastry2/operations/get-name');
    await h1('/pastries/{name}');
    await fireEvent.click(await screen.findByRole('button', { name: 'Simulate' }));
    expect(await screen.findByText(/200 OK/)).toBeTruthy();
    expect(screen.queryByText('Unsaved changes')).toBeNull();
    await fireEvent.click(screen.getByRole('radio', { name: /^FALLBACK/ }));
    expect(await screen.findByText(/Unsaved changes/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save behavior' }).hasAttribute('disabled')).toBe(false);
  });

  it('Behavior: the Saved strip follows a save, in the Stored as short form', async () => {
    renderAt('/services/pastry2/operations/get-name');
    await h1('/pastries/{name}');
    const strip = await screen.findByRole('note', { name: 'Saved behavior' });
    expect(strip.textContent).toContain('URI_PARTS · rule: name');
    expect(strip.textContent).toContain('dispatcher inferred from the OpenAPI path parameter');
    await fireEvent.click(screen.getByRole('radio', { name: /^SCRIPT/ }));
    await fireEvent.click(screen.getByRole('button', { name: 'Save behavior' }));
    await waitFor(() => expect(strip.textContent).toContain('GROOVY · <script, 10 lines>'));
    expect(strip.textContent).not.toContain('inferred');
  });

  it('Copilot: opens on 3 proposals from the workflow context, accepts one and rejects one', async () => {
    renderAt('/services/pastry2/copilot?op=get-name&hint=Tarte%20Tatin');
    await h1('AI Copilot');
    expect(await screen.findByLabelText('Opened from a workflow run')).toBeTruthy();
    const first = await screen.findByRole('article', { name: 'Tartelette Framboise, pending' });
    expect(within(first).getByRole('button', { name: /^200 Tartelette Framboise/ }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: /Export accepted examples/ }).hasAttribute('disabled')).toBe(true);
    await fireEvent.click(within(first).getByRole('button', { name: 'Accept Tartelette Framboise' }));
    expect(await screen.findByRole('article', { name: 'Tartelette Framboise, accepted' })).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Undo for Tartelette Framboise' })));
    await fireEvent.click(screen.getByRole('button', { name: 'Reject Paris-Brest' }));
    expect(await screen.findByRole('article', { name: 'Paris-Brest, rejected' })).toBeTruthy();
    expect(screen.getByText('1 pending proposal stays here and are not added.')).toBeTruthy();
    const exportButton = screen.getByRole('button', { name: /Export accepted examples/ });
    await fireEvent.click(exportButton);
    expect(exportButton.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('api-pastry-2.0-examples.yaml')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Add 1 example to API Pastry 2.0/ })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Generate again' }));
    await waitFor(() => {
      const indicator = document.querySelector('.copilot-generating .live');
      expect(indicator?.getAttribute('data-size')).toBe('compact');
      expect(indicator?.getAttribute('data-pulse')).toBe('false');
    });
    await waitFor(() => expect(screen.queryByRole('article', { name: 'Paris-Brest, rejected' })).toBeNull());
    expect(screen.getByRole('article', { name: 'Tartelette Framboise, accepted' })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel generation' }));
    expect(screen.queryByRole('article', { name: 'Kouign-amann, pending' })).toBeNull();
    expect(screen.getByRole('article', { name: 'Tartelette Framboise, accepted' })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Dismiss the workflow context' }));
    expect(screen.queryByLabelText('Opened from a workflow run')).toBeNull();
  });
});
