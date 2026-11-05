import type { AnyHandler } from 'msw';

/**
 * Prefix of every API handler path. The demo is served under a sub-path (`/microcks-deep-ink/demo/` on Pages,
 * `/` in dev and in tests), so handlers match any origin and directory: `http.get(`${API}/services`, ...)`.
 */
export const API = '*/api';

/** Every feature's handlers (`./<feature>.ts`), shared by the browser worker and the vitest server. */
export const handlers: AnyHandler[] = [];
