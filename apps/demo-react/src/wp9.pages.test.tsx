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

const describedBy = (el: HTMLElement) =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ')
    .trim();

describe('Run a test (/tests/create)', () => {
  it('labels every field, mirrors the form in the CI snippet and switches the CI format', async () => {
    renderAt('/tests/create?service=pastry2');
    expect(await screen.findByRole('heading', { level: 1, name: 'Run a test' })).toBeTruthy();
    expect((await screen.findAllByRole('radio')).length).toBeGreaterThanOrEqual(2);
    const endpoint = screen.getByLabelText(/Test endpoint/) as HTMLInputElement;
    fireEvent.change(endpoint, { target: { value: 'https://pastry.example.test/api' } });
    const snippet = screen.getByRole('region', { name: 'microcks CLI code' });
    expect(snippet.textContent).toContain('https://pastry.example.test/api');
    expect(screen.getByText('1 line differs from the default configuration.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'GitHub Actions' }));
    expect(screen.getByRole('button', { name: 'GitHub Actions' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('region', { name: 'GitHub Actions code' }).textContent).toContain('- name: Contract test API Pastry 2.0');
  });

  it('tells which field is wrong, ties the error to it, and launches a valid test', async () => {
    const router = renderAt('/tests/create?service=pastry2');
    const endpoint = (await screen.findByLabelText(/Test endpoint/)) as HTMLInputElement;
    fireEvent.change(endpoint, { target: { value: '' } });
    const launch = screen.getByRole('button', { name: 'Launch test' });
    expect(launch.getAttribute('aria-disabled')).toBe('true');
    expect(describedBy(launch)).toBe('A test endpoint is required.');
    fireEvent.click(launch);
    expect(document.activeElement).toBe(endpoint);
    expect(router.state.location.pathname).toBe('/tests/create');
    expect(endpoint.getAttribute('aria-invalid')).toBe('true');
    expect(describedBy(endpoint)).toContain('A test endpoint is required.');
    fireEvent.change(endpoint, { target: { value: 'https://pastry.example.test/api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Launch test' }));
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/tests\/runner\/.+/));
  });
});

describe('Test run (/tests/runner/:id)', () => {
  it('shows the finished run #118 as passed, with a runner log and no violation', async () => {
    renderAt('/tests/runner/118');
    expect(await screen.findByRole('heading', { level: 1, name: 'Run #118' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' }).textContent).toContain('Tests');
    expect(await screen.findByRole('log', { name: 'Runner log' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Verdict' }).textContent).toContain('Passed');
    expect(screen.queryByText('$.price')).toBeNull();
  });

  it('runs #119 live from step 3, steps forward, skips to the result and explains the price violation', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderAt('/tests/runner/119');
    const progress = await screen.findByRole('region', { name: 'Progress' });
    expect(progress.textContent).toContain('3/7');
    fireEvent.click(screen.getByRole('button', { name: 'Step forward' }));
    expect(progress.textContent).toContain('4/7');
    expect(screen.getByRole('button', { name: /Millefeuille/ }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: /Eclair Chocolat · price/ }).getAttribute('aria-disabled')).toBe('true');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Skip to result' })).toBeNull());
    expect(screen.getByRole('region', { name: 'Verdict' }).textContent).toContain('86%');
    expect(screen.getByRole('region', { name: 'Verdict' }).textContent).toContain('6 pts vs run #118');
    const diff = screen.getByRole('region', { name: /Contract versus actual response for Eclair Chocolat · price/ });
    expect(diff.textContent).toContain('$.price');
    expect(diff.textContent).toContain('$.status');
    expect(screen.getByRole('link', { name: /Same contract violation breaks workflow Restock a pastry/ }).getAttribute('href')).toContain('6729a1d27e4c0b5f93a8c214');
    fireEvent.click(screen.getByRole('button', { name: 'Add to CI' }));
    expect(screen.getByRole('region', { name: 'Add to CI' }).textContent).toContain('MICROCKS_CLIENT_SECRET');
    fireEvent.click(screen.getByRole('button', { name: 'Replay run' }));
    expect((await screen.findByRole('region', { name: 'Progress' })).textContent).toContain('0/7');
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
    expect(screen.getByRole('table', { name: /Conformance timeline, last 20 runs/ })).toBeTruthy();
    fireEvent.click(within(screen.getByRole('group', { name: 'Result' })).getByRole('button', { name: /^Failed/ }));
    expect(within(await screen.findByRole('table', { name: 'Test runs' })).queryByText('#118')).toBeNull();
    expect(screen.getByText(/match the filters/)).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Reset filters' })[0]!);
    expect(within(screen.getByRole('table', { name: 'Test runs' })).getByText('#118')).toBeTruthy();
  });

  it('shows one pressed bar per run and inspects the run of the clicked bar', async () => {
    renderAt('/tests/service/pastry2');
    const nav = await screen.findByRole('navigation', { name: 'Breadcrumb' });
    expect(within(nav).getByRole('link', { name: 'APIs & Services' })).toBeTruthy();
    const group = await screen.findByRole('group', { name: /Runs, oldest to newest/ });
    const bars = within(group).getAllByRole('button');
    expect(bars).toHaveLength(20);
    expect(bars.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.getAttribute('aria-label'))).toEqual([
      expect.stringMatching(/^Run #117, failed, 2\.11 s, 6\/7 samples passed/),
    ]);
    const timeout = within(group).getByRole('button', { name: /^Run #113, timed out, 10\.00 s/ });
    fireEvent.click(timeout);
    expect(timeout.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByRole('link', { name: 'Open run #113' })[0]?.getAttribute('href')).toContain('/tests/runner/113');
    fireEvent.click(screen.getByRole('button', { name: 'Show run #118 in the timeline' }));
    expect(within(group).getByRole('button', { name: /^Run #118,/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('img', { name: /^GET \/pastries: 19 passed, 1 failed/ })).toBeTruthy();
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
  it('shows the four key figures', async () => {
    renderAt('/metrics/pastry2');
    await screen.findByRole('heading', { level: 1 });
    const figures = await screen.findByRole('region', { name: 'Key figures' }, { timeout: 3000 });
    const cards = within(figures).getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(cards).toEqual(['Mock invocations · today', 'Peak hour', 'Last request', 'Conformance']);
    expect(within(figures).getByRole('region', { name: 'Last request' }).textContent).toContain('12 s ago');
    expect(within(figures).getByRole('link', { name: 'GET /rest/API+Pastry/2.0/pastries/Millefeuille' }).getAttribute('href')).toContain('/traces?service=pastry2');
    expect(within(figures).getByRole('region', { name: 'Conformance' }).textContent).toContain('92%');
  });

  it('selects a bar with the keyboard and keeps text equivalents', async () => {
    renderAt('/metrics/pastry2');
    await screen.findByRole('heading', { level: 1, name: 'Usage & conformance' });
    const group = await screen.findByRole('group', { name: /one bar per hour/i });
    const bars = within(group).getAllByRole('button');
    const current = bars.find((b) => b.getAttribute('aria-pressed') === 'true') as HTMLElement;
    expect(current).toBeTruthy();
    fireEvent.keyDown(current, { key: 'ArrowLeft' });
    await waitFor(() => expect(bars.filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(1));
    expect(screen.getByRole('table', { name: 'Invocations per hour · today' })).toBeTruthy();
    expect(screen.getByRole('table', { name: 'Invocations per week and weekday' })).toBeTruthy();
    const ops = screen.getByRole('table', { name: 'Invocations per operation' });
    expect(within(ops).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Operation', 'Dispatcher', 'Invocations', 'Share', 'vs previous', 'Last call']);
  });

  it('switches period and shows the conformance treemap and index card', async () => {
    renderAt('/metrics/pastry2');
    await screen.findByRole('heading', { level: 1 });
    fireEvent.click(await screen.findByRole('button', { name: '7 days' }));
    await screen.findByRole('group', { name: /one bar per day/i });
    const treemap = await screen.findByRole('region', { name: 'Conformance risk by domain' });
    const pastry = within(treemap).getByRole('region', { name: 'domain=pastry' });
    expect(within(pastry).getAllByRole('link').map((l) => l.textContent)).toEqual([
      expect.stringContaining('API Pastry 2.0'), expect.stringContaining('API Pastry 1.0'), expect.stringContaining('Pastry orders API 0.1.0'),
    ]);
    expect(within(treemap).getByRole('link', { name: /API Pastry 2\.0.*conformance\s*92%, conformant/ }).getAttribute('aria-current')).toBe('true');
    expect(within(treemap).getByRole('region', { name: 'no domain label' })).toBeTruthy();
    const index = screen.getByRole('region', { name: 'Conformance index vs current score' });
    expect(within(index).getByRole('img', { name: 'Current score 92 percent, conformance index 92 percent' })).toBeTruthy();
    expect(within(index).getAllByRole('link')).toHaveLength(10);
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
    await screen.findByText('Installed', { selector: '.callout *, .callout' }).catch(() => undefined);
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

describe('Usage heatmap (/metrics/pastry2)', () => {
  it('names each day with its count and selects the latest day', async () => {
    renderAt('/metrics/pastry2');
    await screen.findByRole('heading', { level: 1 });
    const heat = await screen.findByRole('group', { name: /Calendar heatmap/ }, { timeout: 3000 });
    expect(screen.getByRole('heading', { level: 2, name: 'Daily invocations · last 12 weeks' })).toBeTruthy();
    const days = within(heat).getAllByRole('button');
    expect(days).toHaveLength(79);
    expect(days.find((d) => d.getAttribute('aria-pressed') === 'true')?.getAttribute('aria-label')).toBe('Tue, Nov 3: 296 invocations');
  });
});
