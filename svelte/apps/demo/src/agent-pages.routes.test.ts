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

// The first route of the file loads its lazy chunks cold: give the h1 more than the 1 s default.
const h1 = (name: string) => screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });

describe('Agent (screen 18)', () => {
  it('opens the Pastry concierge on the service route, with its skills, the failing ones flagged', async () => {
    renderAt('/services/concierge/skills');
    await h1('A2A Pastry concierge 1.0');
    await waitFor(() => expect(document.title).toBe('Pastry concierge 1.0 · Microcks'));
    const skills = await screen.findByRole('list', { name: 'Skills of Pastry concierge 1.0' });
    expect(within(skills).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('tab', { name: /Mock endpoints/ })).toBeTruthy();
    expect(screen.getByText(/A2A spec 1\.0/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Run a test' }).getAttribute('href')).toContain('/tests/agent');
    expect(screen.getByRole('tab', { name: /Tasks/ })).toBeTruthy();
  });

  it('shows the task script of a conversation and moves between conversations of a skill', async () => {
    renderAt('/services/concierge/skills');
    await h1('A2A Pastry concierge 1.0');
    await screen.findByRole('list', { name: /Script of eclair-size-m/ });
    await fireEvent.click(screen.getByRole('button', { name: /Track an order/ }));
    await fireEvent.click(await screen.findByRole('button', { name: /unknown-order/ }));
    expect(await screen.findByRole('list', { name: /Script of unknown-order/ })).toBeTruthy();
  });

  it('serves the card as published and as the mock rewrites it', async () => {
    renderAt('/services/concierge/card');
    await h1('A2A Pastry concierge 1.0');
    await fireEvent.click(await screen.findByRole('button', { name: 'Served by the mock' }));
    expect(await screen.findByText(/supportedInterfaces rewritten to the mock/)).toBeTruthy();
    const lines = screen.getByRole('list', { name: 'Lines of the mock copy, changed lines marked' });
    expect(within(lines).getAllByText('added:')).toHaveLength(3);
  });

  it('writes one sample per binding and switches to the streaming call', async () => {
    renderAt('/services/concierge/mock');
    await h1('A2A Pastry concierge 1.0');
    expect((await screen.findAllByText(/A2A-Version: 1\.0/)).length).toBeGreaterThan(0);
    await fireEvent.click(screen.getByRole('button', { name: 'SendStreamingMessage' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'What the stream returns' })).toBeTruthy();
  });

  it('lists the tasks and cancels a live one; a terminal one cannot be canceled', async () => {
    renderAt('/services/concierge/tasks');
    await h1('A2A Pastry concierge 1.0');
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('row').length).toBeGreaterThan(6);
    await fireEvent.click(within(table).getByRole('button', { name: 'task-41b8' }));
    expect((screen.getByRole('button', { name: 'CancelTask' }) as HTMLButtonElement).disabled).toBe(true);
    await fireEvent.click(within(table).getByRole('button', { name: 'task-5e27' }));
    const cancel = screen.getByRole('button', { name: 'CancelTask' }) as HTMLButtonElement;
    expect(cancel.disabled).toBe(false);
    await fireEvent.click(cancel);
    await waitFor(() => expect(within(screen.getByRole('region', { name: 'Detail of task-5e27' })).getAllByText('canceled').length).toBeGreaterThan(0));
  });
});
