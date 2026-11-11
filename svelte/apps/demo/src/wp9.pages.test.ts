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
