import { useEffect } from 'react';
import { useMatches } from 'react-router';
import { useAnnounce } from './announcer';

export const PAGE_TITLE_ID = 'page-title';
export const TITLE_SUFFIX = ' · Microcks';

/** Route id of the last page that set its title (module state: one router per document). */
let lastRouteId: string | undefined;

/** Tests only. */
export function resetPageFocusState(): void {
  lastRouteId = undefined;
}

function focusHeading(attemptsLeft = 3): void {
  const heading = document.getElementById(PAGE_TITLE_ID);
  if (heading) {
    heading.focus();
    return;
  }
  // The page renders its header after loading: retry a few frames, then fall back to <main>.
  if (attemptsLeft > 0) requestAnimationFrame(() => focusHeading(attemptsLeft - 1));
  else document.getElementById('main')?.focus();
}

/**
 * Per-route accessibility contract (RGAA 8.5 and 12.x, WCAG 2.4.2):
 * 1. sets a unique `document.title`: `"<Page> · Microcks"` (the suffix is added when missing);
 * 2. announces the new title in the shell's live region;
 * 3. when the ROUTE (not just the URL) changes, moves focus to the page's `<h1>` (`PageHeader`).
 *    Changing a tab, a filter or a route param on the same page does not steal focus. The very first
 *    page load keeps the browser's default focus so the skip link stays the first Tab stop.
 *
 * Call it once per page, with the prototype `<title>`, e.g. `usePageTitle('Cockpit · Microcks')`.
 */
export function usePageTitle(title: string): void {
  const announce = useAnnounce();
  const matches = useMatches();
  const routeId = matches[matches.length - 1]?.id ?? 'unknown';
  const full = title.endsWith(TITLE_SUFFIX) ? title : `${title}${TITLE_SUFFIX}`;

  useEffect(() => {
    document.title = full;
    announce(full);
    if (lastRouteId !== undefined && lastRouteId !== routeId) focusHeading();
    lastRouteId = routeId;
  }, [full, routeId, announce]);
}
