import { createHashRouter, createMemoryRouter, Navigate, type RouteObject } from 'react-router';
import { AppLayout } from './AppLayout';
import { RouteErrorPage } from './RouteErrorPage';
import { ROUTES, TESTS_REDIRECT, type RouteSpec } from './routes';

function toRoute(spec: RouteSpec): RouteObject {
  const lazy: RouteObject['lazy'] = async () => ({ Component: (await spec.load()).default });
  const handle = { nav: spec.nav };
  if (spec.path === '/') return { id: spec.id, index: true, handle, lazy };
  return { id: spec.id, path: spec.path.replace(/^\//, ''), handle, lazy };
}

/** Route objects of the demo: shell layout, error boundary, redirect and lazy pages. */
export function buildRoutes(): RouteObject[] {
  return [
    {
      id: 'shell',
      path: '/',
      element: <AppLayout />,
      children: [
        {
          errorElement: <RouteErrorPage />,
          children: [
            ...ROUTES.map(toRoute),
            { id: 'tests-redirect', path: TESTS_REDIRECT.from.replace(/^\//, ''), element: <Navigate to={TESTS_REDIRECT.to} replace /> },
          ],
        },
      ],
    },
  ];
}

/** Hash router (decision D13: GitHub Pages has no SPA fallback). */
export function createAppRouter() {
  return createHashRouter(buildRoutes());
}

/** Memory router for tests. */
export function createTestRouter(initialEntries: string[]) {
  return createMemoryRouter(buildRoutes(), { initialEntries });
}
