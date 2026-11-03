import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

const h1 = (name: string) => screen.findByRole('heading', { level: 1, name });

beforeEach(() => {
  resetPageFocusState();
  document.title = '';
});
afterEach(() => vi.useRealTimers());

describe('Agent (screen 18)', () => {
  it('opens the Pastry concierge on the service route, with its skills, the failing ones flagged', async () => {
    renderAt('/services/concierge/skills');
    await h1('Pastry concierge 1.0');
    expect(document.title).toBe('Pastry concierge 1.0 · Microcks');
    const skills = await screen.findByRole('list', { name: 'Skills of Pastry concierge 1.0' });
    expect(within(skills).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('tab', { name: /Mock endpoints/ })).toBeTruthy();
    expect(screen.getByText(/A2A spec 1\.0/)).toBeTruthy();
  });

  it('shows the task script of a conversation and moves between conversations of a skill', async () => {
    renderAt('/services/concierge/skills');
    await h1('Pastry concierge 1.0');
    await screen.findByRole('list', { name: /Script of eclair-size-m/ });
    fireEvent.click(screen.getByRole('button', { name: /Track an order/ }));
    fireEvent.click(await screen.findByRole('button', { name: /unknown-order/ }));
    expect(await screen.findByRole('list', { name: /Script of unknown-order/ })).toBeTruthy();
  });

  it('serves the card as published and as the mock rewrites it', async () => {
    renderAt('/services/concierge/card');
    await h1('Pastry concierge 1.0');
    fireEvent.click(await screen.findByRole('button', { name: 'Served by the mock' }));
    expect(await screen.findByText(/supportedInterfaces rewritten to the mock/)).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Lines that change in the mock copy' })).toBeTruthy();
  });

  it('writes one sample per binding and switches to the streaming call', async () => {
    renderAt('/services/concierge/mock');
    await h1('Pastry concierge 1.0');
    expect((await screen.findAllByText(/A2A-Version: 1\.0/)).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'SendStreamingMessage' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'What the stream returns' })).toBeTruthy();
  });

  it('lists the tasks and cancels a live one; a terminal one cannot be canceled', async () => {
    renderAt('/services/concierge/tasks');
    await h1('Pastry concierge 1.0');
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('row').length).toBeGreaterThan(6);
    fireEvent.click(within(table).getByRole('button', { name: 'task-41b8' }));
    expect((screen.getByRole('button', { name: 'CancelTask' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(within(table).getByRole('button', { name: 'task-5e27' }));
    const cancel = screen.getByRole('button', { name: 'CancelTask' }) as HTMLButtonElement;
    expect(cancel.disabled).toBe(false);
    await act(async () => { fireEvent.click(cancel); });
    await waitFor(() => expect(within(screen.getByRole('region', { name: 'Detail of task-5e27' })).getAllByText('canceled').length).toBeGreaterThan(0));
  });
});

describe('Agent test (screen 19)', () => {
  it('opens the stored run #3 on its matrix, with the HTTP+JSON order failure explained', async () => {
    renderAt('/tests/agent/3');
    await h1('Agent test #3');
    expect(await screen.findByText(/13 of 15 conversation checks passed/)).toBeTruthy();
    const detail = await screen.findByRole('region', { name: /Detail of HTTP\+JSON × eclair-size-m/ });
    expect(within(detail).getByText('NEW task t-2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /gRPC × ord-2417-ready: Failed/ }));
    expect(await screen.findByRole('region', { name: /Detail of gRPC × ord-2417-ready/ })).toBeTruthy();
    expect(screen.getByText(/lastChunk: not set/)).toBeTruthy();
  });

  it('starts on the setup, explains what blocks the run, then replays the checks to the result', async () => {
    renderAt('/tests/agent');
    await h1('Test the agent');
    const run = await screen.findByRole('button', { name: 'Run the test' });
    expect((run as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText('3 × 5 = 15 conversation checks, plus 4 Agent Card checks.')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: /JSON-RPC/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /HTTP\+JSON/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /^gRPC/ }));
    expect(screen.getByText('Select at least one transport.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Run the test' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: /JSON-RPC/ }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Run the test' })); });
    expect(await screen.findByRole('button', { name: 'Skip to the result' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Skip to the result' }));
    expect(await screen.findByText(/5 of 5 conversation checks passed/)).toBeTruthy();
  });
});

describe('Sources and Add a source', () => {
  it('drops Import from the navigation and keeps Sources highlighted on the add page', async () => {
    renderAt('/sources/new');
    await h1('Add a source');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).queryByRole('link', { name: 'Import' })).toBeNull();
    expect(within(nav).getByRole('link', { name: 'Sources' }).getAttribute('aria-current')).toBe('page');
  });

  it('filters the sources by origin and hides the schedule switch of uploads', async () => {
    renderAt('/sources');
    await h1('Sources');
    await screen.findByRole('article', { name: 'Pastry concierge · Agent Card' });
    expect(screen.getByRole('link', { name: 'Add source' }).getAttribute('href')).toContain('/sources/new');
    fireEvent.click(screen.getByRole('button', { name: /^Upload/ }));
    await waitFor(() => expect(screen.queryByRole('article', { name: 'Pastry orders events' })).toBeNull());
    const card = screen.getByRole('article', { name: 'Pastry concierge · Agent Card' });
    expect(within(card).queryByRole('switch')).toBeNull();
    expect(within(card).getByText('no schedule · one-off')).toBeTruthy();
    expect(within(card).getByRole('link', { name: 'Re-upload Pastry concierge · Agent Card' })).toBeTruthy();
  });

  it('imports the Agent Card example as an A2A service', async () => {
    renderAt('/sources/new');
    await h1('Add a source');
    fireEvent.click(screen.getByRole('button', { name: /Example: Pastry concierge/ }));
    expect(await screen.findByText(/3 skills discovered/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Agent imported, mock is live' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Test the agent' }).getAttribute('href')).toContain('/tests/agent?service=concierge');
  });
});
