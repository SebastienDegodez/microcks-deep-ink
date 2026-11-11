/**
 * Public API of the demo shell for pages. Import from `@/ui/app`.
 * (`router.svelte.ts`, `routes.ts` and `App.svelte` are deliberately NOT exported here: pages are lazy-loaded
 * by the router, so exporting them would create an import cycle. Loading and error states live in
 * `@/ui/app/states`, with their stylesheet.)
 */
export { default as UseCasesProvider } from './UseCasesProvider.svelte';
export { useUseCases, useClock, useRelativeTime } from './services';
export { useQuery, useSubscription } from './query.svelte.js';
export type { QueryResult, QueryState, SubscriptionOptions, SubscriptionResult } from './query.svelte.js';
export { usePageTitle, PAGE_TITLE_ID } from './page-title.svelte.js';
export { useAnnounce } from './announcer';
export { default as LiveAnnouncerProvider } from './LiveAnnouncerProvider.svelte';
export { useReturnFocus, useAutoFocus, moveFocus } from './focus.svelte.js';
export type { FocusTarget } from './focus.svelte.js';
export { default as PageHeader } from './PageHeader.svelte';
export type { PageHeaderProps, Crumb } from './PageHeader.svelte';
export { default as AppLayout } from './AppLayout.svelte';
export { NAV_ITEMS } from './nav';
export type { NavId, NavItem } from './nav';
export { default as RouterLink } from './RouterLink.svelte';
export { default as ButtonRouterLink } from './ButtonRouterLink.svelte';
export { default as Navigate } from './Navigate.svelte';
export { useParams, useSearchParams, useNavigate, useLocation } from './router.svelte.js';
export type { NavigateFunction, NavigateOptions, SetSearchParams, To } from './router.svelte.js';
