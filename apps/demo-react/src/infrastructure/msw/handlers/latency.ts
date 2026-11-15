import { delay, http, type AnyHandler } from 'msw';
import { isFastMode, nextLatencyMs } from '@/infrastructure/in-memory/shared';
import { API } from './api';

/** Polled feeds (`.../progress`, `demo/<feed>/calls`): their pace is the poll interval, like the in-memory streams. */
const FEED = /\/(progress|calls)$/;

/**
 * The simulated network latency of the `http` backend: the same deterministic 120..350 ms as the in-memory adapters
 * (`nextLatencyMs()`), once per `/api/` request, through MSW `delay()`. Fast mode (`?fast`, the localStorage flag,
 * vitest) removes it. Registered first: it returns nothing, so MSW goes on to the handler that answers.
 * The browser worker turns the adapters' own per-call latency off (`setPerCallLatency(false)`): never both.
 */
export function createLatencyHandlers(): AnyHandler[] {
  return [
    http.all(`${API}/*`, async ({ request }) => {
      if (isFastMode() || FEED.test(new URL(request.url).pathname)) return;
      await delay(nextLatencyMs());
    }),
  ];
}
