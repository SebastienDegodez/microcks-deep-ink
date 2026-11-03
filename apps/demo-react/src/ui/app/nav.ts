export type NavId =
  | 'cockpit'
  | 'catalogue'
  | 'workflows'
  | 'import'
  | 'tests'
  | 'sources'
  | 'metrics'
  | 'traces'
  | 'hub'
  | 'admin';

export interface NavItem {
  id: NavId;
  label: string;
  /** Hash route. */
  to: string;
}

/** Order of the prototype navigation. */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'cockpit', label: 'Cockpit', to: '/' },
  { id: 'catalogue', label: 'APIs & Services', to: '/services' },
  { id: 'workflows', label: 'Workflows', to: '/workflows' },
  { id: 'import', label: 'Import', to: '/import' },
  { id: 'tests', label: 'Tests', to: '/tests' },
  { id: 'sources', label: 'Sources', to: '/importers' },
  { id: 'metrics', label: 'Usage & conformance', to: '/metrics' },
  { id: 'traces', label: 'Live traces', to: '/traces' },
  { id: 'hub', label: 'Hub', to: '/hub' },
  { id: 'admin', label: 'Administration', to: '/admin' },
];

/** Route `handle` shape: which nav entry a route belongs to. */
export interface RouteHandle {
  nav?: NavId;
}
