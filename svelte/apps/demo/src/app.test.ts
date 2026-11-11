import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.svelte';
import { demo } from './model.svelte';
import { screens } from './data';

const initial = JSON.stringify(demo);
beforeEach(() => {
  Object.assign(demo, JSON.parse(initial));
  window.history.replaceState(null, '', '/');
});
afterEach(() => vi.useRealTimers());
function open(path: string) {
  window.history.replaceState(null, '', `/#${path}`);
  return render(App);
}

describe('Svelte clickable journey', () => {
  it.each(screens)('opens $n · $title directly', async ({ href }) => {
    open(href);
    await waitFor(() =>
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1),
    );
    expect(screen.queryByText('Page not found')).toBeNull();
    expect(screen.queryByText('Screen in progress')).toBeNull();
    await waitFor(() => expect(document.activeElement?.tagName).toBe('H1'));
  });

  it('filters the catalogue and switches to the badge wall', async () => {
    open('/services');
    await fireEvent.input(
      screen.getByRole('searchbox', { name: 'Filter by name' }),
      { target: { value: 'concierge' } },
    );
    expect(
      screen
        .getAllByRole('status')
        .some((el) => el.textContent?.includes('1 of 9')),
    ).toBe(true);
    await fireEvent.click(screen.getByRole('button', { name: 'Badge wall' }));
    expect(screen.queryByRole('table')).toBeNull();
    expect(
      screen
        .getByRole('link', { name: /Pastry concierge/ })
        .getAttribute('href'),
    ).toBe('#/services/concierge');
  });

  it('accepts a proposal and makes it available after navigation', async () => {
    open('/services/pastry2/copilot');
    await fireEvent.click(
      screen.getByRole('button', { name: 'Accept Paris-Brest' }),
    );
    expect(demo.examples.some((e) => e.name === 'Paris-Brest')).toBe(true);
    window.location.hash = '/services/pastry2';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Paris-Brest' })).toBeTruthy(),
    );
  });

  it('previews an import before creating its in-memory source', async () => {
    open('/sources/new');
    await fireEvent.click(
      screen.getByRole('button', { name: 'Preview import' }),
    );
    expect(screen.getByRole('alert').textContent).toContain('Choose a file');
    await fireEvent.click(
      screen.getByRole('button', { name: 'Use sample contract' }),
    );
    await fireEvent.click(
      screen.getByRole('button', { name: 'Preview import' }),
    );
    expect(demo.sources).toHaveLength(3);
    await fireEvent.click(
      screen.getByRole('button', { name: 'Import source' }),
    );
    expect(demo.sources).toHaveLength(4);
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Sources', level: 1 }),
      ).toBeTruthy(),
    );
  });

  it('steps through a replay and stops at the failing workflow step', async () => {
    open('/workflows/runs/6729a1d27e4c0b5f93a8c214');
    await fireEvent.click(screen.getByRole('button', { name: 'Replay run' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByRole('button', { name: 'Resume' })).toBeTruthy();
    expect(
      within(screen.getByRole('region', { name: 'Progress' })).getByText(
        'getPastry',
      ),
    ).toBeTruthy();
  });

  it('honors the workflow target and passes on mocks', async () => {
    demo.workflowTarget = 'mocks';
    open('/workflows/runs/6729a1d27e4c0b5f93a8c214');
    expect(screen.getByText('Workflow passed')).toBeTruthy();
    expect(screen.getByText('All steps passed')).toBeTruthy();
    expect(
      screen.queryByText('Schema validation failed', { exact: true }),
    ).toBeNull();
  });
  it('preserves the result and operation count of a passing history run', () => {
    open('/tests/runner/118');
    expect(screen.getByText('Finished · all checks passed')).toBeTruthy();
    expect(
      screen.getByRole('img', { name: '2 of 2 operations checked' }),
    ).toBeTruthy();
    expect(
      screen.queryByText('Schema validation failed', { exact: true }),
    ).toBeNull();
  });

  it('creates a masked secret and confirms deletion', async () => {
    open('/admin');
    await fireEvent.click(screen.getByRole('tab', { name: 'Secrets' }));
    await fireEvent.click(
      screen.getByRole('button', { name: 'Create secret' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Create a demo secret' });
    await fireEvent.input(within(dialog).getByLabelText(/Name/), {
      target: { value: 'demo-token' },
    });
    await fireEvent.input(within(dialog).getByLabelText(/Dummy credential/), {
      target: { value: 'dummy-value' },
    });
    await fireEvent.submit(
      within(dialog)
        .getByRole('button', { name: 'Create secret' })
        .closest('form')!,
    );
    expect(demo.secrets.find((s) => s.name === 'demo-token')?.summary).toBe(
      '••••••••',
    );
    expect(JSON.stringify(demo.secrets)).not.toContain('dummy-value');
    const row = screen.getByRole('cell', { name: 'demo-token' }).closest('tr')!;
    await fireEvent.click(within(row).getByRole('button', { name: 'Delete' }));
    expect(demo.secrets).toHaveLength(2);
    await fireEvent.click(
      screen.getByRole('button', { name: 'Delete secret' }),
    );
    expect(demo.secrets).toHaveLength(1);
  });
});
