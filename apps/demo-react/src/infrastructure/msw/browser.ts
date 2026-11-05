import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/** The browser mock of the API. Imported by `main.tsx` only, and only when the backend is `http`. */
export const worker = setupWorker(...handlers);

/**
 * Registers `mockServiceWorker.js` (copied from `public/` by Vite) next to `index.html`. The URL is relative
 * because the demo runs under `/microcks-deep-ink/demo/` on Pages (Vite `base: './'`): the worker scope is
 * then that directory, never the whole origin.
 *
 * `quiet` removes MSW's console logs (the a11y smoke run fails on any console error and the demo stays silent).
 * Unhandled requests: every non-API request (scripts, CSS chunks, fonts) bypasses the worker silently; an
 * `/api/` request without a handler is a bug, so it is reported with `console.error` (and fails the smoke run)
 * instead of silently hitting a server that does not exist on Pages.
 */
export function startWorker(): Promise<unknown> {
  return worker.start({
    serviceWorker: { url: './mockServiceWorker.js' },
    quiet: true,
    onUnhandledFrame({ frame, defaults }) {
      const request = frame.protocol === 'http' ? (frame.data as { request?: Request }).request : undefined;
      if (request && new URL(request.url).pathname.includes('/api/')) defaults.error();
    },
  });
}
