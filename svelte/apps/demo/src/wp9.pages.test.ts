import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createComposition } from '@/composition-root';
import App from '@/ui/app/App.svelte';
import { resetPageFocusState } from '@/ui/app/page-title.svelte.js';
import { createAppRouter } from '@/ui/app/routes';

function renderAt(path: string) {
  window.history.replaceState(null, '', `#${path}`);
  const { useCases, clock } = createComposition();
  const router = createAppRouter();
  const view = render(App, { props: { useCases, clock, router } });
  return { router, ...view };
}

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
    await fireEvent.input(endpoint, { target: { value: 'https://pastry.example.test/api' } });
    const snippet = screen.getByRole('region', { name: 'microcks CLI code' });
    expect(snippet.textContent).toContain('https://pastry.example.test/api');
    expect(screen.getByText('1 line differs from the default configuration.')).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'GitHub Actions' }));
    expect(screen.getByRole('button', { name: 'GitHub Actions' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('region', { name: 'GitHub Actions code' }).textContent).toContain('- name: Contract test API Pastry 2.0');
  });

  it('tells which field is wrong, ties the error to it, and launches a valid test', async () => {
    const { router } = renderAt('/tests/create?service=pastry2');
    const endpoint = (await screen.findByLabelText(/Test endpoint/)) as HTMLInputElement;
    await fireEvent.input(endpoint, { target: { value: '' } });
    const launch = screen.getByRole('button', { name: 'Launch test' });
    expect(launch.getAttribute('aria-disabled')).toBe('true');
    expect(describedBy(launch)).toBe('A test endpoint is required.');
    await fireEvent.click(launch);
    expect(document.activeElement).toBe(endpoint);
    expect(router.location.pathname).toBe('/tests/create');
    expect(endpoint.getAttribute('aria-invalid')).toBe('true');
    expect(describedBy(endpoint)).toContain('A test endpoint is required.');
    await fireEvent.input(endpoint, { target: { value: 'https://pastry.example.test/api' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Launch test' }));
    await waitFor(() => expect(router.location.pathname).toMatch(/^\/tests\/runner\/.+/));
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
    await fireEvent.click(within(screen.getByRole('group', { name: 'Result' })).getByRole('button', { name: /^Failed/ }));
    expect(within(await screen.findByRole('table', { name: 'Test runs' })).queryByText('#118')).toBeNull();
    expect(screen.getByText(/match the filters/)).toBeTruthy();
    await fireEvent.click(screen.getAllByRole('button', { name: 'Reset filters' })[0]!);
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
    await fireEvent.click(timeout);
    expect(timeout.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByRole('link', { name: 'Open run #113' })[0]?.getAttribute('href')).toContain('/tests/runner/113');
    await fireEvent.click(screen.getByRole('button', { name: 'Show run #118 in the timeline' }));
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
