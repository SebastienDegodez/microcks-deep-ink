import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { RouterProvider } from 'react-router';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createComposition } from '@/composition-root';
import { UseCasesProvider } from '@/ui/app';
import { createTestRouter } from '@/ui/app/router';
import { resetPageFocusState } from '@/ui/app/usePageTitle';

function renderAt(path: string) {
  const { useCases, clock } = createComposition();
  const router = createTestRouter([path]);
  const view = render(
    <UseCasesProvider useCases={useCases} clock={clock}>
      <RouterProvider router={router} />
    </UseCasesProvider>,
  );
  return { router, ...view };
}

beforeAll(() => {
  // jsdom has no modal <dialog>.
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) { this.removeAttribute('open'); };
});

beforeEach(() => {
  resetPageFocusState();
  document.title = '';
});

const h1 = (name: string | RegExp) => screen.findByRole('heading', { level: 1, name });

describe('WP7 pages', () => {
  it('Cockpit: KPIs, protocol filter chips, Needs attention with #119 and the live pause button', async () => {
    renderAt('/');
    await h1('Cockpit');
    expect(await screen.findByRole('heading', { level: 2, name: 'Needs attention' })).toBeTruthy();
    expect(screen.getAllByText(/Test #119/).length).toBeGreaterThan(0);
    const chip = screen.getByRole('button', { name: /^EVENT 2/ });
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(chip);
    expect(screen.getByRole('button', { name: /^EVENT 2/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(/of 11 services/)).toBeTruthy();
    const pause = screen.getByRole('button', { name: 'Pause' });
    fireEvent.click(pause);
    expect(screen.getByRole('button', { name: 'Resume' }).getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(document.title).toBe('Cockpit · Microcks'));
  });

  it('Cockpit: the empty install shows the getting-started checklist', async () => {
    renderAt('/');
    await h1('Cockpit');
    fireEvent.click(await screen.findByRole('button', { name: 'Show empty install' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Getting started' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mark step 1 as done' }));
    expect(screen.getByText('1 of 3 done')).toBeTruthy();
  });

  it('Catalogue: shows 11 services, filters by status and resets', async () => {
    renderAt('/services');
    await h1('APIs & Services');
    await screen.findByRole('link', { name: 'Open API Pastry 2.0' });
    expect(screen.getByTestId('result-count').textContent).toContain('11 of 11');
    fireEvent.click(screen.getByRole('button', { name: /^Failing/ }));
    await waitFor(() => expect(screen.getByTestId('result-count').textContent).toContain('5 of 11'));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter by name' }), { target: { value: 'zzz' } });
    expect(await screen.findByRole('heading', { level: 2, name: 'No API matches these filters' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    await waitFor(() => expect(screen.getByTestId('result-count').textContent).toContain('11 of 11'));
  });

  it('Service: operations tab with the AI proposal, then properties and tests tabs', async () => {
    renderAt('/services/pastry2/operations');
    await h1('API Pastry 2.0');
    await screen.findByRole('button', { name: /Accept Tartelette Framboise/ });
    expect(screen.getByRole('button', { name: /Accept Tartelette Framboise/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /Tests/ }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Latest test runs' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /#119/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Properties & MCP' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Agent-ready' })).toBeTruthy();
  });

  it('Behavior: simulates a call and warns when a change is unsaved', async () => {
    renderAt('/services/pastry2/operations/get-name');
    await h1('/pastries/{name}');
    fireEvent.click(await screen.findByRole('button', { name: 'Simulate' }));
    expect(await screen.findByText(/200 OK/)).toBeTruthy();
    expect(screen.queryByText('Unsaved changes')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /^FALLBACK/ }));
    expect(await screen.findByText(/Unsaved changes/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save behavior' }).hasAttribute('disabled')).toBe(false);
  });

  it('Copilot: shows the workflow context, generates proposals and accepts one', async () => {
    renderAt('/services/pastry2/copilot?op=get-name&hint=Tarte%20Tatin');
    await h1('AI Copilot');
    expect(await screen.findByLabelText('Opened from a workflow run')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Generate examples' }));
    const first = await screen.findByRole('article', { name: /Tarte Tatin.*pending/ });
    expect(first).toBeTruthy();
    fireEvent.click(within(first).getByRole('button', { name: /^Accept / }));
    expect(await screen.findByText('Accepted')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Export accepted examples/ }).hasAttribute('disabled')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss the workflow context' }));
    expect(screen.queryByLabelText('Opened from a workflow run')).toBeNull();
  });

  it('Import: analyzes the sample then imports it', async () => {
    renderAt('/sources/new');
    await h1('Add a source');
    fireEvent.click(screen.getByRole('button', { name: 'Sample: API Pastry' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Preview before creating the source' })).toBeTruthy();
    expect(screen.getByText(/3 Operations discovered · 7 Examples/)).toBeTruthy();
    expect(screen.getByText('Microcks sample · samples/APIPastry-openapi.yaml')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Source created' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open service' }).getAttribute('href')).toContain('/services/pastry2');
    expect(screen.getByText('apipastry-openapi.yaml · primary')).toBeTruthy();
  });

  it('Import: a Git source with empty fields takes the placeholders', async () => {
    renderAt('/sources/new');
    await h1('Add a source');
    fireEvent.click(screen.getByRole('tab', { name: 'Git repository' }));
    fireEvent.click(screen.getByRole('button', { name: 'Analyze repository' }));
    expect(await screen.findByText(/The source “API Pastry — main” will be created/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Create source' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Source created' })).toBeTruthy();
  });

  it('Import: the Direct API form takes the placeholders and shows labelled errors', async () => {
    renderAt('/sources/new');
    await h1('Add a source');
    fireEvent.click(screen.getByRole('tab', { name: 'Direct API' }));
    fireEvent.change(screen.getByLabelText('Resource'), { target: { value: '1x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create mock' }));
    expect(await screen.findByText(/Use letters, digits/)).toBeTruthy();
    expect(screen.getByLabelText('Resource').getAttribute('aria-invalid')).toBe('true');
    fireEvent.change(screen.getByLabelText('Resource'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create mock' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Mock created and live' })).toBeTruthy();
    expect(screen.getByText(/Order API 1.0 exposes the “order” resource/)).toBeTruthy();
  });

  it('Sources: lists jobs, filters failed, deletes with a confirmation and undoes', async () => {
    renderAt('/sources');
    await h1('Sources');
    await screen.findByRole('article', { name: 'Pastry orders events' });
    fireEvent.click(screen.getByRole('button', { name: /^Failed/ }));
    await waitFor(() => expect(screen.queryByRole('article', { name: 'Hello gRPC' })).toBeNull());
    expect(screen.getByRole('alert').textContent).toMatch(/401 Unauthorized/);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Pastry orders events' }));
    const confirm = await screen.findByRole('alertdialog', { name: 'Confirm deletion of Pastry orders events' });
    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete source' }));
    expect(await screen.findByText(/deleted. Services already discovered remain/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await screen.findByRole('article', { name: 'Pastry orders events' });
  });

  it('Sources: a timeline entry with a revision shows its diff', async () => {
    renderAt('/sources/pastry-openapi');
    await h1('Sources');
    expect(await screen.findByRole('region', { name: 'Unified diff' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'API Pastry 2.0 · OpenAPI' })).toBeTruthy();
    await act(async () => {});
  });
});
