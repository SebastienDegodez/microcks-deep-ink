/**
 * Prefix of every API handler path. The demo is served under a sub-path (`/microcks-deep-ink/demo/` on Pages,
 * `/` in dev and in tests), so handlers match any origin and directory: `http.get(`${API}/services`, ...)`.
 * In its own module so the feature handlers (`./<feature>.ts`) import it without a cycle through `./index.ts`.
 */
export const API = '*/api';
