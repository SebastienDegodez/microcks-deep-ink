/**
 * Composition root: the ONLY place (with main.tsx) that wires infrastructure to the application layer.
 *
 * Each `createInMemory<Feature>Adapters()` returns the ports its feature OWNS. Cross-feature reads go
 * through ports too, so this file hands the owning feature's port to the feature that needs it
 * (for example `observe` reads the catalogue and the test runs).
 *
 * Backends (`createComposition({ backend })`):
 * - `memory` (default): every feature uses its in-memory adapters, nothing goes over the network.
 * - `http`: a feature that has HTTP adapters (`src/infrastructure/http/<feature>`, registered in `HTTP_ADAPTERS`)
 *   calls `/api/...` with `fetch` (answered by MSW in the browser and in vitest); a feature without them FALLS BACK
 *   to its in-memory adapters. The fallback lets the features move to HTTP one pull request at a time while the demo
 *   keeps rendering the same screens; `httpFeatures` tells which features really use HTTP.
 */
import { createAgentUseCases } from '@/application/agents';
import { createArazzoUseCases } from '@/application/arazzo';
import { createCatalogUseCases } from '@/application/catalog';
import { createCopilotUseCases } from '@/application/copilot';
import { createGovernUseCases } from '@/application/govern';
import { createImportingUseCases } from '@/application/importing';
import { createObserveUseCases } from '@/application/observe';
import { createTestingUseCases } from '@/application/testing';
import type { Clock } from '@/application/ports/shared';
import type { UseCases } from '@/application/use-cases';
import { createHttpCatalogAdapters } from '@/infrastructure/http/catalog';
import { createHttpClient, defaultApiBaseUrl, type HttpClient } from '@/infrastructure/http/client';
import { createHttpImportingAdapters } from '@/infrastructure/http/importing';
import { createHttpTestingAdapters } from '@/infrastructure/http/testing';
import { createInMemoryAgentAdapters } from '@/infrastructure/in-memory/agents';
import { createInMemoryArazzoAdapters } from '@/infrastructure/in-memory/arazzo';
import { createInMemoryCatalogAdapters } from '@/infrastructure/in-memory/catalog';
import { createInMemoryCopilotAdapters } from '@/infrastructure/in-memory/copilot';
import { createInMemoryGovernAdapters } from '@/infrastructure/in-memory/govern';
import { createInMemoryImportingAdapters } from '@/infrastructure/in-memory/importing';
import { createInMemoryObserveAdapters } from '@/infrastructure/in-memory/observe';
import { FixedClock, type InMemoryDeps } from '@/infrastructure/in-memory/shared';
import { createInMemoryTestingAdapters } from '@/infrastructure/in-memory/testing';

export type Backend = 'memory' | 'http';
export const BACKENDS: readonly Backend[] = ['memory', 'http'];
export type Feature = keyof UseCases;

/** Reads `VITE_DEMO_BACKEND` (or any string): unset or empty means `memory`, an unknown value throws. */
export function parseBackend(value: string | undefined): Backend {
  if (value === undefined || value === '') return 'memory';
  if ((BACKENDS as readonly string[]).includes(value)) return value as Backend;
  throw new Error(`Unknown demo backend "${value}": expected one of ${BACKENDS.join(', ')}.`);
}

export interface CompositionOptions {
  /** Defaults to a `FixedClock` at 2026-11-03T09:10:04Z. */
  clock?: InMemoryDeps['clock'];
  /** Defaults to `memory`. */
  backend?: Backend;
  /** `http` backend only. Defaults to `<directory of the page>/api/`. */
  apiBaseUrl?: string;
}

export interface Composition {
  useCases: UseCases;
  /** Source of "now" for relative dates (`formatRelative(clock.now(), date)`). */
  clock: Clock;
  backend: Backend;
  /** Features served by HTTP adapters (always empty with the `memory` backend). */
  httpFeatures: Feature[];
}

interface HttpDeps {
  http: HttpClient;
  clock: Clock;
}

/** The ports each feature's adapters provide (the in-memory factories are the reference). */
interface InMemoryAdapters {
  catalog: ReturnType<typeof createInMemoryCatalogAdapters>;
  copilot: ReturnType<typeof createInMemoryCopilotAdapters>;
  importing: ReturnType<typeof createInMemoryImportingAdapters>;
  testing: ReturnType<typeof createInMemoryTestingAdapters>;
  arazzo: ReturnType<typeof createInMemoryArazzoAdapters>;
  observe: ReturnType<typeof createInMemoryObserveAdapters>;
  govern: ReturnType<typeof createInMemoryGovernAdapters>;
  agents: ReturnType<typeof createInMemoryAgentAdapters>;
}

/**
 * HTTP adapters per feature: each factory returns the same ports as `createInMemory<Feature>Adapters`.
 * A feature missing here falls back to memory until its `src/infrastructure/http/<feature>` lands.
 */
const HTTP_ADAPTERS: { [F in Feature]?: (deps: HttpDeps) => InMemoryAdapters[F] } = {
  catalog: createHttpCatalogAdapters,
  importing: createHttpImportingAdapters,
  testing: createHttpTestingAdapters,
};

/** Builds every use case over the chosen backend. Call once at boot (or once per test). */
export function createComposition(options: CompositionOptions = {}): Composition {
  const clock = options.clock ?? new FixedClock();
  const backend = options.backend ?? 'memory';
  const deps: InMemoryDeps = { clock };
  const httpDeps: HttpDeps | null =
    backend === 'http' ? { http: createHttpClient({ baseUrl: options.apiBaseUrl ?? defaultApiBaseUrl() }), clock } : null;
  const httpFeatures: Feature[] = [];

  /** The feature's HTTP adapters when the backend is `http` and they exist, else its in-memory adapters. */
  function adapters<F extends Feature>(feature: F, inMemory: (deps: InMemoryDeps) => InMemoryAdapters[F]): InMemoryAdapters[F] {
    const http = HTTP_ADAPTERS[feature] as ((deps: HttpDeps) => InMemoryAdapters[F]) | undefined;
    if (httpDeps && http) {
      httpFeatures.push(feature);
      return http(httpDeps);
    }
    return inMemory(deps);
  }

  const catalog = adapters('catalog', createInMemoryCatalogAdapters);
  const copilot = adapters('copilot', createInMemoryCopilotAdapters);
  const importing = adapters('importing', createInMemoryImportingAdapters);
  const testing = adapters('testing', createInMemoryTestingAdapters);
  const arazzo = adapters('arazzo', createInMemoryArazzoAdapters);
  const observe = adapters('observe', createInMemoryObserveAdapters);
  const govern = adapters('govern', createInMemoryGovernAdapters);
  const agents = adapters('agents', createInMemoryAgentAdapters);

  const useCases: UseCases = {
    catalog: createCatalogUseCases({ catalog: catalog.catalog }),
    copilot: createCopilotUseCases({ copilot: copilot.copilot, catalog: catalog.catalog }),
    importing: createImportingUseCases(importing),
    testing: createTestingUseCases({ testRuns: testing.testRuns, catalog: catalog.catalog, secrets: importing.secrets }),
    arazzo: createArazzoUseCases({ ...arazzo, secrets: importing.secrets }),
    observe: createObserveUseCases({ ...observe, catalog: catalog.catalog, testRuns: testing.testRuns, clock }),
    govern: createGovernUseCases({ ...govern, secrets: importing.secrets }),
    agents: createAgentUseCases(agents),
  };
  return { useCases, clock, backend, httpFeatures };
}

/** Shortcut for tests that only need the use cases. */
export function createUseCases(options: CompositionOptions = {}): UseCases {
  return createComposition(options).useCases;
}
