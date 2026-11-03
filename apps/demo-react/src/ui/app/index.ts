/**
 * Public API of the demo shell for pages. Import from `@/ui/app`.
 * (`router.tsx` and `routes.ts` are deliberately NOT exported here: pages are lazy-loaded by the
 * router, so exporting it would create an import cycle.)
 */
export { UseCasesProvider, useUseCases, useClock, useRelativeTime } from './UseCasesProvider';
export { useQuery, useSubscription } from './hooks';
export type { QueryResult, QueryState, SubscriptionOptions, SubscriptionResult } from './hooks';
export { usePageTitle, PAGE_TITLE_ID } from './usePageTitle';
export { useAnnounce, LiveAnnouncerProvider } from './announcer';
export { PageHeader } from './PageHeader';
export type { PageHeaderProps } from './PageHeader';
export { DemoBanner } from './DemoBanner';
export { PagePlaceholder } from './PagePlaceholder';
export { AppLayout } from './AppLayout';
export { NAV_ITEMS } from './nav';
export type { NavId, NavItem } from './nav';
