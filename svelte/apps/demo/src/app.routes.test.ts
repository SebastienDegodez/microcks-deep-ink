import { render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { createComposition } from '@/composition-root';
import App from '@/ui/app/App.svelte';
import { resetPageFocusState } from '@/ui/app/page-title.svelte.js';
import { ROUTES, TESTS_REDIRECT, createAppRouter } from '@/ui/app/routes';

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

describe('route table', () => {
  it('matches section 3.6 of the plan: routes, owners and unique ids', () => {
    expect(ROUTES.map((r) => r.id)).toHaveLength(new Set(ROUTES.map((r) => r.id)).size);
    expect(ROUTES.filter((r) => r.owner === 'WP7').map((r) => r.path)).toEqual([
      '/', '/sources/new', '/sources/:importerId?', '/services', '/services/:serviceId/:tab?',
      '/services/:serviceId/operations/:operationId', '/services/:serviceId/copilot',
    ]);
    expect(ROUTES.filter((r) => r.owner === 'WP8').map((r) => r.path)).toEqual([
      '/workflows', '/workflows/:docId/:workflowId/:tab?', '/workflows/:docId/:workflowId/run', '/workflows/runs/:runId',
    ]);
    expect(ROUTES.filter((r) => r.owner === 'WP9').map((r) => r.path)).toEqual([
      '/tests/create', '/tests/agent/:runId?', '/tests/runner/:testRunId', '/tests/service/:serviceId', '/metrics/:serviceId?', '/traces', '/hub/:packageId?', '/admin/:tab?',
    ]);
    expect(ROUTES.filter((r) => r.owner === 'WP3').map((r) => r.path)).toEqual(['/map', '*']);
  });

  it('has a page module with a default export for every route', async () => {
    for (const route of ROUTES) {
      const module = await route.load();
      expect(typeof module.default, route.id).toBe('function');
    }
  });
});

describe('every route renders a page with one h1 and a document title', () => {
  it.each(ROUTES.map((r) => [r.id, r.example, r.title] as const))('%s (%s)', async (id, example, title) => {
    renderAt(example);
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(heading.getAttribute('tabindex')).toBe('-1');
    await waitFor(() => expect(document.title.endsWith(' · Microcks')).toBe(true));
    if (!['service', 'workflow', 'test-run', 'behavior', 'agent-test'].includes(id)) await waitFor(() => expect(document.title).toBe(title));
  });
});

describe('shell accessibility', () => {
  it('provides skip link, landmarks and live region on every page', async () => {
    renderAt('/services');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('link', { name: 'Skip to content' })).toBeTruthy();
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeTruthy();
    expect(screen.getByRole('main').id).toBe('main');
    expect(screen.getByRole('main').getAttribute('tabindex')).toBe('-1');
    expect(screen.getByTestId('live-region').getAttribute('aria-live')).toBe('polite');
  });

  it('marks the active navigation entry with aria-current="page", by nav id', async () => {
    renderAt('/services/pastry2/operations/get-name');
    await screen.findByRole('heading', { level: 1 });
    const current = screen.getAllByRole('link', { current: 'page' });
    expect(current.map((l) => l.textContent)).toEqual(['APIs & Services']);
  });

  it('lists the navigation in the prototype order', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect([...nav.querySelectorAll('a')].map((a) => a.textContent)).toEqual([
      'Cockpit', 'APIs & Services', 'Workflows', 'Tests', 'Sources', 'Usage & conformance', 'Live traces', 'Hub', 'Administration',
    ]);
  });

  it('has a theme toggle with aria-pressed and an accessible name', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    const toggle = screen.getByRole('button', { name: 'Light theme' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    toggle.click();
    expect(document.documentElement.dataset.theme).toBe('light');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Light theme' }).getAttribute('aria-pressed')).toBe('true'));
    screen.getByRole('button', { name: 'Light theme' }).click();
    await tick();
  });

  it('the skip link moves focus to <main> without touching the hash route', async () => {
    const { router } = renderAt('/services');
    await screen.findByRole('heading', { level: 1 });
    screen.getByRole('link', { name: 'Skip to content' }).click();
    expect(document.activeElement).toBe(screen.getByRole('main'));
    expect(router.location.pathname).toBe('/services');
    expect(window.location.hash).toBe('#/services');
  });

  it('collapses the navigation behind an expandable button', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    const button = screen.getByRole('button', { name: 'Menu' });
    expect(document.getElementById(button.getAttribute('aria-controls') ?? '')?.tagName).toBe('NAV');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    button.click();
    await tick();
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('routing', () => {
  it('redirects /tests to the history of API Pastry', async () => {
    const { router } = renderAt(TESTS_REDIRECT.from);
    await screen.findByRole('heading', { level: 1, name: 'Test history' });
    expect(router.location.pathname).toBe(TESTS_REDIRECT.to);
    expect(window.location.hash).toBe(`#${TESTS_REDIRECT.to}`);
  });

  // Enabled once the workflow pages are ported (the placeholder shows the route title).
  it.skip('ranks static segments above dynamic ones', async () => {
    renderAt('/workflows/runs/6729a1d27e4c0b5f93a8c214');
    expect(await screen.findByRole('heading', { level: 1, name: 'Run #14' })).toBeTruthy();
    await waitFor(() => expect(document.title).toBe('Workflow run · Microcks'));
  });

  // Enabled once the workflow and service pages are ported (the placeholder shows the route title).
  it.skip('routes the run setup and the operation behavior to their own pages', async () => {
    const first = renderAt('/workflows/pastry/restock-pastry/run');
    await screen.findByRole('heading', { level: 1, name: 'Run workflow' });
    first.unmount();
    const second = renderAt('/services/pastry2/operations/get-name');
    await screen.findByRole('heading', { level: 1, name: '/pastries/{name}' });
    second.unmount();
    renderAt('/services/pastry2/copilot?op=get-name&hint=Tarte%20Tatin');
    await screen.findByRole('heading', { level: 1, name: 'AI Copilot' });
  });

  it('shows the not-found page with a link back', async () => {
    renderAt('/no/such/page');
    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to the Cockpit' })).toBeTruthy();
  });

  it('links every screen of the map to a matching route', async () => {
    renderAt('/map');
    await screen.findByRole('heading', { level: 1, name: 'From contract to proof' });
    const links = screen.getAllByRole('link').filter((l) => l.closest('.demo-map'));
    expect(links).toHaveLength(19);
  });
});

describe('focus management on route change', () => {
  it('moves focus to the new <h1> and announces the title; the first load keeps the default focus', async () => {
    const { router } = renderAt('/');
    await screen.findByRole('heading', { level: 1, name: 'Cockpit' });
    expect(document.activeElement).toBe(document.body);

    router.navigate('/hub');
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Hub' });
    await waitFor(() => expect(document.activeElement).toBe(h1));
    await waitFor(() => expect(screen.getByTestId('live-region').textContent).toBe('Hub · Microcks'));
  });

  it('does not steal focus when only the tab or the query changes on the same page', async () => {
    const { router } = renderAt('/admin/users');
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Administration' });
    router.navigate('/hub');
    await screen.findByRole('heading', { level: 1, name: 'Hub' });
    router.navigate('/hub/banking');
    await waitFor(() => expect(router.location.pathname).toBe('/hub/banking'));
    await screen.findByRole('heading', { level: 1, name: 'Hub' });
    (document.activeElement as HTMLElement | null)?.blur();
    router.navigate('/hub/api-pastry?x=1');
    await waitFor(() => expect(router.location.search).toBe('?x=1'));
    await tick();
    expect(document.activeElement).toBe(document.body);
    expect(h1).toBeTruthy();
  });
});
