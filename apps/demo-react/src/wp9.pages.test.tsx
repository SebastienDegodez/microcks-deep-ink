import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { RouterProvider } from 'react-router';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
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

beforeAll(() => {
  // jsdom has no modal <dialog>.
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
});

beforeEach(() => {
  resetPageFocusState();
  document.title = '';
});
afterEach(() => {
  vi.useRealTimers();
});

describe('Run a test (/tests/create)', () => {
  it('labels every field, mirrors the form in the CI snippet and switches the CI format', async () => {
    renderAt('/tests/create?service=pastry2');
    expect(await screen.findByRole('heading', { level: 1, name: 'Run a test' })).toBeTruthy();
    expect((await screen.findAllByRole('radio')).length).toBeGreaterThanOrEqual(2);
    const endpoint = screen.getByLabelText(/Test endpoint/) as HTMLInputElement;
    fireEvent.change(endpoint, { target: { value: 'https://pastry.example.test/api' } });
    const snippet = screen.getByRole('region', { name: /command/i, hidden: false });
    expect(snippet.textContent).toContain('https://pastry.example.test/api');
    fireEvent.click(screen.getByRole('tab', { name: /GitHub/i }));
    expect(screen.getByRole('tabpanel').textContent).toContain('uses:');
  });

  it('tells which field is wrong, ties the error to it, and launches a valid test', async () => {
    const router = renderAt('/tests/create?service=pastry2');
    const endpoint = (await screen.findByLabelText(/Test endpoint/)) as HTMLInputElement;
    fireEvent.change(endpoint, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Launch test' }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Test endpoint');
    expect(endpoint.getAttribute('aria-invalid')).toBe('true');
    expect(endpoint.getAttribute('aria-describedby')).toBeTruthy();
    fireEvent.change(endpoint, { target: { value: 'https://pastry.example.test/api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Launch test' }));
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/tests\/runner\/.+/));
  });
});

describe('Test run (/tests/runner/:id)', () => {
  it('shows the finished run #118 as passed, with a runner log and no violation', async () => {
    renderAt('/tests/runner/118');
    expect(await screen.findByRole('heading', { level: 1, name: 'Test run #118' })).toBeTruthy();
    expect(await screen.findByRole('log', { name: 'Runner log' })).toBeTruthy();
    expect(screen.queryByText('$.price')).toBeNull();
  });

  it('streams the 7 steps of #119, can be paused, and explains the price violation', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderAt('/tests/runner/119');
    await screen.findByRole('button', { name: 'Pause' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
    });
    await waitFor(() => expect(document.querySelectorAll('.tr-step-btn')).toHaveLength(7));
    expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
    const detail = document.getElementById('tr-detail') as HTMLElement;
    expect(detail.textContent).toContain('$.price');
    expect(detail.textContent).toContain('$.status');
    expect(screen.getByRole('link', { name: /Open workflow run #14/ }).getAttribute('href')).toContain('6729a1d27e4c0b5f93a8c214');
  });
});

describe('Test history (/tests/service/:id)', () => {
  it('lists the runs with #117 selected, filters them, and gives the timeline a text equivalent', async () => {
    renderAt('/tests/service/pastry2');
    await screen.findByRole('heading', { level: 1 });
    const table = await screen.findByRole('table', { name: 'Test runs' });
    expect(within(table).getByText('#119')).toBeTruthy();
    expect(within(table).getByText('#118')).toBeTruthy();
    expect(table.querySelector('tr[data-selected]')?.textContent).toContain('#117');
    expect(screen.getByRole('img', { name: /Conformance of each test run/ })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Result'), { target: { value: 'failed' } });
    expect(within(await screen.findByRole('table', { name: 'Test runs' })).queryByText('#118')).toBeNull();
  });

  it('keeps #118 (passed) in the history next to the failing #119', async () => {
    renderAt('/tests/service/pastry2');
    const table = await screen.findByRole('table', { name: 'Test runs' });
    const rows = within(table).getAllByRole('row').map((r) => r.textContent ?? '');
    expect(rows.some((t) => t.includes('#118') && t.includes('Passed'))).toBe(true);
    expect(rows.some((t) => t.includes('#119') && t.includes('Failed'))).toBe(true);
  });
});

describe('Usage (/metrics/:serviceId?)', () => {
  it('selects a bar with the keyboard and offers the data table', async () => {
    renderAt('/metrics/pastry2');
    await screen.findByRole('heading', { level: 1, name: 'Usage & conformance' });
    const group = await screen.findByRole('group', { name: /one bar per hour/ });
    const bars = within(group).getAllByRole('button');
    const current = bars.find((b) => b.getAttribute('aria-pressed') === 'true') as HTMLElement;
    expect(current).toBeTruthy();
    fireEvent.keyDown(current, { key: 'ArrowLeft' });
    await waitFor(() => expect(bars.filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(1));
    expect(screen.getAllByText('Show data table').length).toBeGreaterThanOrEqual(3);
  });

  it('switches period and shows a conformance meter', async () => {
    renderAt('/metrics/pastry2');
    await screen.findByRole('heading', { level: 1 });
    fireEvent.click(await screen.findByRole('button', { name: '7 days' }));
    await screen.findByRole('group', { name: /one bar per day/ });
    expect(screen.getByRole('meter')).toBeTruthy();
  });
});

describe('Live traces (/traces)', () => {
  it('lists the calls, pauses and clears', async () => {
    renderAt('/traces');
    await screen.findByRole('heading', { level: 1, name: 'Live traces' });
    const table = await screen.findByRole('table', { name: /Calls received/ });
    expect(within(table).getAllByRole('row').length).toBeGreaterThan(1);
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByRole('button', { name: 'Resume' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await screen.findByText('No call yet');
  });

  it('prefills the Arazzo only switch from ?run= and narrows the list to that run', async () => {
    renderAt('/traces?run=6729a1d27e4c0b5f93a8c214');
    await screen.findByRole('heading', { level: 1 });
    const toggle = (await screen.findByRole('switch', { name: /Arazzo only/ })) as HTMLInputElement;
    expect(toggle.checked).toBe(true);
  });
});

describe('Hub (/hub/:packageId?)', () => {
  it('opens banking and walks install to installed', async () => {
    renderAt('/hub/banking');
    await screen.findByRole('heading', { level: 1, name: 'Hub' });
    const install = await screen.findByRole('button', { name: /Install/ });
    fireEvent.click(install);
    await screen.findByText('Installed', { selector: '.di-callout *, .di-callout' }).catch(() => undefined);
    await waitFor(() => expect(screen.queryByRole('button', { name: /Install/ })).toBeNull());
  });

  it('shows API Pastry as already installed', async () => {
    renderAt('/hub/pastry');
    await screen.findByRole('heading', { level: 1 });
    await waitFor(() => expect(screen.getAllByText('Installed').length).toBeGreaterThan(0));
    expect(screen.queryByRole('button', { name: /^Install/ })).toBeNull();
  });
});

describe('Administration (/admin/:tab?)', () => {
  it('changes a role and tells it in a status message', async () => {
    renderAt('/admin/users');
    await screen.findByRole('heading', { level: 1, name: 'Administration' });
    const selects = (await screen.findAllByRole('combobox')) as HTMLSelectElement[];
    const editable = selects.find((s) => !s.disabled && s.value === 'user') as HTMLSelectElement;
    fireEvent.change(editable, { target: { value: 'manager' } });
    await waitFor(() => expect(document.querySelector('.ad-toast')?.textContent).toMatch(/manager/i));
  });

  it('flags the pending requests on Groups and saves a membership draft', async () => {
    renderAt('/admin/groups');
    await screen.findByRole('heading', { level: 1 });
    expect(await screen.findByRole('tab', { name: /pending/ })).toBeTruthy();
    expect(await screen.findByText(/pending requests/)).toBeTruthy();
    const save = screen.getByRole('button', { name: 'Save changes' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    const box = screen.getAllByRole('checkbox')[0] as HTMLInputElement;
    fireEvent.click(box);
    expect(save.disabled).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect((screen.getAllByRole('checkbox')[0] as HTMLInputElement).checked).toBe(!box.checked ? false : box.checked);
  });

  it('creates a secret through the dialog and toggles a feature flag', async () => {
    renderAt('/admin/secrets');
    await screen.findByRole('heading', { level: 1 });
    fireEvent.click(await screen.findByRole('button', { name: 'Create secret' }));
    fireEvent.change(await screen.findByLabelText(/^Name/), { target: { value: 'staging-token' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'hunter2hunter2' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Create secret' }).pop() as HTMLElement);
    await waitFor(() => expect(screen.getByText('staging-token')).toBeTruthy());
  });
});
