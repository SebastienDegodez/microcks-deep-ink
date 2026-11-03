/**
 * Composition root: the ONLY place (with main.tsx) that wires infrastructure to the application layer.
 *
 * Each `createInMemory<Feature>Adapters()` returns the ports its feature OWNS. Cross-feature reads go
 * through ports too, so this file hands the owning feature's port to the feature that needs it
 * (for example `observe` reads the catalogue and the test runs).
 *
 * To plug a real backend, replace the factories below by adapters that implement the same ports.
 */
import { createArazzoUseCases } from '@/application/arazzo';
import { createCatalogUseCases } from '@/application/catalog';
import { createCopilotUseCases } from '@/application/copilot';
import { createGovernUseCases } from '@/application/govern';
import { createImportingUseCases } from '@/application/importing';
import { createObserveUseCases } from '@/application/observe';
import { createTestingUseCases } from '@/application/testing';
import type { Clock } from '@/application/ports/shared';
import type { UseCases } from '@/application/use-cases';
import { createInMemoryArazzoAdapters } from '@/infrastructure/in-memory/arazzo';
import { createInMemoryCatalogAdapters } from '@/infrastructure/in-memory/catalog';
import { createInMemoryCopilotAdapters } from '@/infrastructure/in-memory/copilot';
import { createInMemoryGovernAdapters } from '@/infrastructure/in-memory/govern';
import { createInMemoryImportingAdapters } from '@/infrastructure/in-memory/importing';
import { createInMemoryObserveAdapters } from '@/infrastructure/in-memory/observe';
import { FixedClock, type InMemoryDeps } from '@/infrastructure/in-memory/shared';
import { createInMemoryTestingAdapters } from '@/infrastructure/in-memory/testing';

export interface CompositionOptions {
  /** Defaults to a `FixedClock` at 2026-11-03T09:10:04Z. */
  clock?: InMemoryDeps['clock'];
}

export interface Composition {
  useCases: UseCases;
  /** Source of "now" for relative dates (`formatRelative(clock.now(), date)`). */
  clock: Clock;
}

/** Builds every use case over the in-memory adapters. Call once at boot (or once per test). */
export function createComposition(options: CompositionOptions = {}): Composition {
  const clock = options.clock ?? new FixedClock();
  const deps: InMemoryDeps = { clock };

  const catalog = createInMemoryCatalogAdapters(deps);
  const copilot = createInMemoryCopilotAdapters(deps);
  const importing = createInMemoryImportingAdapters(deps);
  const testing = createInMemoryTestingAdapters(deps);
  const arazzo = createInMemoryArazzoAdapters(deps);
  const observe = createInMemoryObserveAdapters(deps);
  const govern = createInMemoryGovernAdapters(deps);

  const useCases: UseCases = {
    catalog: createCatalogUseCases({ catalog: catalog.catalog }),
    copilot: createCopilotUseCases({ copilot: copilot.copilot, catalog: catalog.catalog }),
    importing: createImportingUseCases(importing),
    testing: createTestingUseCases({ testRuns: testing.testRuns, catalog: catalog.catalog, secrets: importing.secrets }),
    arazzo: createArazzoUseCases({ ...arazzo, secrets: importing.secrets }),
    observe: createObserveUseCases({ ...observe, catalog: catalog.catalog, testRuns: testing.testRuns, clock }),
    govern: createGovernUseCases({ ...govern, secrets: importing.secrets }),
  };
  return { useCases, clock };
}

/** Shortcut for tests that only need the use cases. */
export function createUseCases(options: CompositionOptions = {}): UseCases {
  return createComposition(options).useCases;
}
