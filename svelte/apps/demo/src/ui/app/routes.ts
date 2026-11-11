import type { Component } from 'svelte';
import type { NavId } from './nav';
import { createRouter, type AppRoute, type Router } from './router.svelte.js';

/**
 * Route table of the demo (hash routes). One entry per page module; the router (`router.svelte.ts`) builds
 * lazy routes from it and tests assert it against section 3.6 of the plan.
 *
 * Optional segments (`:tab?`) keep a page on ONE route id when its tab or selection changes, so the
 * route-change focus rule of `usePageTitle` does not fire on in-page navigation.
 *
 * The router ranks static segments (`runs`, `run`, `operations`, `copilot`) above dynamic ones, so
 * `/workflows/runs/:runId` wins over `/workflows/:docId/:workflowId`. Document ids are never `runs`.
 */
export interface RouteSpec {
  /** Stable route id (the last id of the router's matches). */
  id: string;
  /** Screen number in the Parcours screen map, or `—`. */
  screen: string;
  /** Hash route pattern. */
  path: string;
  /** A concrete URL that matches (tests, screen map). */
  example: string;
  /** Prototype `<title>`. */
  title: string;
  /** Phase-2 owner of the page module. */
  owner: 'WP3' | 'WP7' | 'WP8' | 'WP9';
  /** Navigation entry highlighted for this route. */
  nav?: NavId;
  /** Lazy import of `src/ui/pages/<folder>/<Name>Page.svelte` (default export). */
  load: () => Promise<{ default: Component }>;
}

/** Page not ported yet: its title in a page header. */
const pending = () => import('@/ui/pages/pending/PendingPage.svelte');

export const ROUTES: readonly RouteSpec[] = [
  { id: 'cockpit', screen: '03', path: '/', example: '/', title: 'Cockpit · Microcks', owner: 'WP7', nav: 'cockpit',
    load: () => import('@/ui/pages/cockpit/CockpitPage.svelte') },
  { id: 'import', screen: '01', path: '/sources/new', example: '/sources/new', title: 'Add a source · Microcks', owner: 'WP7', nav: 'sources',
    load: () => import('@/ui/pages/import/ImportPage.svelte') },
  { id: 'sources', screen: '02', path: '/sources/:importerId?', example: '/sources', title: 'Sources · Microcks', owner: 'WP7', nav: 'sources',
    load: () => import('@/ui/pages/sources/SourcesPage.svelte') },
  { id: 'catalogue', screen: '04', path: '/services', example: '/services', title: 'APIs & Services · Microcks', owner: 'WP7', nav: 'catalogue',
    load: () => import('@/ui/pages/catalogue/CataloguePage.svelte') },
  { id: 'service', screen: '05', path: '/services/:serviceId/:tab?', example: '/services/pastry2/operations', title: 'API Pastry 2.0 · Microcks', owner: 'WP7', nav: 'catalogue',
    load: () => import('@/ui/pages/service/ServicePage.svelte') },
  { id: 'behavior', screen: '06', path: '/services/:serviceId/operations/:operationId', example: '/services/pastry2/operations/get-name', title: 'Operation behavior · Microcks', owner: 'WP7', nav: 'catalogue',
    load: () => import('@/ui/pages/behavior/BehaviorPage.svelte') },
  { id: 'copilot', screen: '07', path: '/services/:serviceId/copilot', example: '/services/pastry2/copilot?op=get-name&hint=Tarte%20Tatin', title: 'AI Copilot examples · Microcks', owner: 'WP7', nav: 'catalogue',
    load: () => import('@/ui/pages/copilot/CopilotPage.svelte') },
  { id: 'workflows', screen: '15', path: '/workflows', example: '/workflows', title: 'Workflows · Microcks', owner: 'WP8', nav: 'workflows',
    load: pending },
  { id: 'workflow', screen: '16', path: '/workflows/:docId/:workflowId/:tab?', example: '/workflows/pastry/restock-pastry/loom?run=14&step=patchPastry', title: 'Restock a pastry · Microcks', owner: 'WP8', nav: 'workflows',
    load: pending },
  { id: 'workflow-run-setup', screen: '17a', path: '/workflows/:docId/:workflowId/run', example: '/workflows/pastry/restock-pastry/run?scenario=impl14', title: 'Run a workflow · Microcks', owner: 'WP8', nav: 'workflows',
    load: pending },
  { id: 'workflow-run', screen: '17b', path: '/workflows/runs/:runId', example: '/workflows/runs/6729a1d27e4c0b5f93a8c214', title: 'Workflow run · Microcks', owner: 'WP8', nav: 'workflows',
    load: pending },
  { id: 'test-create', screen: '08', path: '/tests/create', example: '/tests/create?service=pastry2', title: 'Run a test · Microcks', owner: 'WP9', nav: 'tests',
    load: pending },
  { id: 'agent-test', screen: '19', path: '/tests/agent/:runId?', example: '/tests/agent/3', title: 'Agent test #3 · Microcks', owner: 'WP9', nav: 'tests',
    load: () => import('@/ui/pages/agent/AgentTestRunPage.svelte') },
  { id: 'test-run', screen: '09', path: '/tests/runner/:testRunId', example: '/tests/runner/119', title: 'Test run #119 · Microcks', owner: 'WP9', nav: 'tests',
    load: pending },
  { id: 'tests', screen: '10', path: '/tests/service/:serviceId', example: '/tests/service/pastry2', title: 'Test history · Microcks', owner: 'WP9', nav: 'tests',
    load: pending },
  { id: 'usage', screen: '11', path: '/metrics/:serviceId?', example: '/metrics/pastry2', title: 'Usage & conformance · Microcks', owner: 'WP9', nav: 'metrics',
    load: pending },
  { id: 'traces', screen: '12', path: '/traces', example: '/traces?service=pastry2', title: 'Live traces · Microcks', owner: 'WP9', nav: 'traces',
    load: pending },
  { id: 'hub', screen: '13', path: '/hub/:packageId?', example: '/hub/banking', title: 'Hub · Microcks', owner: 'WP9', nav: 'hub',
    load: pending },
  { id: 'admin', screen: '14', path: '/admin/:tab?', example: '/admin/users', title: 'Administration · Microcks', owner: 'WP9', nav: 'admin',
    load: pending },
  { id: 'map', screen: '—', path: '/map', example: '/map', title: 'Screen map · Microcks', owner: 'WP3',
    load: () => import('@/ui/pages/map/ScreenMapPage.svelte') },
  { id: 'not-found', screen: '—', path: '*', example: '/does-not-exist', title: 'Page not found · Microcks', owner: 'WP3',
    load: () => import('@/ui/pages/not-found/NotFoundPage.svelte') },
];

/** `/tests` has no page of its own: it redirects here. */
export const TESTS_REDIRECT = { from: '/tests', to: '/tests/service/pastry2' } as const;

function toRoute(spec: RouteSpec): AppRoute {
  const handle = { nav: spec.nav };
  if (spec.path === '/') return { id: spec.id, index: true, handle, load: spec.load };
  return { id: spec.id, path: spec.path.replace(/^\//, ''), handle, load: spec.load };
}

/**
 * Route tree of the demo: the shell, the error boundary of the page area (the pathless `0-0` route,
 * as the reference demo's router names it), the redirect and the lazy pages.
 */
export function buildRoutes(): AppRoute[] {
  return [
    {
      id: 'shell',
      path: '/',
      children: [
        {
          id: '0-0',
          children: [
            ...ROUTES.map(toRoute),
            { id: 'tests-redirect', path: TESTS_REDIRECT.from.replace(/^\//, ''), redirect: TESTS_REDIRECT.to },
          ],
        },
      ],
    },
  ];
}

/** Hash router of the demo (decision D13: GitHub Pages has no SPA fallback). Tests set the hash first. */
export function createAppRouter(): Router {
  return createRouter(buildRoutes());
}
