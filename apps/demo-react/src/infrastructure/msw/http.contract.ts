/**
 * Runs a port contract suite (`src/application/ports/__contracts__/<feature>.contract.ts`) against HTTP adapters
 * answered by MSW in vitest (`msw/node`). Test-only: imported by `src/infrastructure/http/port-contracts.test.ts`
 * (declare `// @vitest-environment node` in the test file, as `client.test.ts` does).
 *
 * Plugging a feature in (E3..E10): once `src/infrastructure/http/<feature>` exports
 * `createHttp<Feature>Adapters({ http, clock })` and `src/infrastructure/msw/handlers/<feature>.ts` serves its API,
 * set `http: createHttp<Feature>Adapters` (and `handlers` if the handlers keep state) on the feature's row of
 * `port-contracts.test.ts`. Until then the row reports a `todo` instead of running.
 */
import type { AnyHandler } from 'msw';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';
import type { PortContract } from '@/application/ports/__contracts__/support.contract';
import type { Clock } from '@/application/ports/shared';
import { createHttpClient, type HttpClient } from '@/infrastructure/http/client';
import { FixedClock } from '@/infrastructure/in-memory/shared';
import { server } from './node';

/** Base URL the HTTP adapters call in the contract runs (any origin matches the `*\/api` handlers). */
export const CONTRACT_API_BASE_URL = 'http://demo.test/api/';

/** What every `createHttp<Feature>Adapters` receives (the same as the composition root's `HttpDeps`). */
export interface HttpAdapterDeps {
  http: HttpClient;
  clock: Clock;
}

export interface HttpContractTarget<T> {
  /** Feature name, as in `UseCases` (`catalog`, `importing`...). */
  feature: string;
  /** The feature's contract suite, the same one the in-memory adapters pass. */
  contract: PortContract<T>;
  /** `createHttp<Feature>Adapters`. Undefined while the feature has no HTTP adapters: the run is reported as `todo`. */
  http?: (deps: HttpAdapterDeps) => T;
  /**
   * Fresh handlers for each test (for handlers that keep a seeded state, so mutations never leak between tests).
   * Omitted: the shared handlers of `src/infrastructure/msw/handlers` (already installed on the server) answer.
   */
  handlers?: () => AnyHandler[];
}

export function describePortContractOverHttp<T>(target: HttpContractTarget<T>): void {
  const { feature, contract, http: createAdapters, handlers } = target;
  if (!createAdapters) {
    describe(`${feature} ports contract · http+MSW`, () => {
      it.todo(`runs once src/infrastructure/http/${feature} provides createHttp<Feature>Adapters`);
    });
    return;
  }
  describe(`${feature} over http`, () => {
    beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    contract('http+MSW', () => {
      if (handlers) server.use(...handlers());
      return createAdapters({ http: createHttpClient({ baseUrl: CONTRACT_API_BASE_URL }), clock: new FixedClock() });
    });
  });
}
