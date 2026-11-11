/**
 * Composition root: the ONLY place (with main.ts) that wires infrastructure to the application layer.
 *
 * Each `createInMemory<Feature>Adapters()` returns the ports its feature OWNS. Cross-feature reads go
 * through ports too, so this file hands the owning feature's port to the feature that needs it
 * (for example `observe` reads the catalogue and the test runs).
 *
 * Every feature uses its in-memory adapters from `@microcks/demo-core`: nothing goes over the network.
 */
import { createAgentUseCases } from '@microcks/demo-core/application/agents';
import { createArazzoUseCases } from '@microcks/demo-core/application/arazzo';
import { createCatalogUseCases } from '@microcks/demo-core/application/catalog';
import { createCopilotUseCases } from '@microcks/demo-core/application/copilot';
import { createGovernUseCases } from '@microcks/demo-core/application/govern';
import { createImportingUseCases } from '@microcks/demo-core/application/importing';
import { createObserveUseCases } from '@microcks/demo-core/application/observe';
import { createTestingUseCases } from '@microcks/demo-core/application/testing';
import type { Clock } from '@microcks/demo-core/application/ports';
import type { UseCases } from '@microcks/demo-core/application/use-cases';
import { createInMemoryAgentAdapters } from '@microcks/demo-core/infrastructure/in-memory/agents';
import { createInMemoryArazzoAdapters } from '@microcks/demo-core/infrastructure/in-memory/arazzo';
import { createInMemoryCatalogAdapters } from '@microcks/demo-core/infrastructure/in-memory/catalog';
import { createInMemoryCopilotAdapters } from '@microcks/demo-core/infrastructure/in-memory/copilot';
import { createInMemoryGovernAdapters } from '@microcks/demo-core/infrastructure/in-memory/govern';
import { createInMemoryImportingAdapters } from '@microcks/demo-core/infrastructure/in-memory/importing';
import { createInMemoryObserveAdapters } from '@microcks/demo-core/infrastructure/in-memory/observe';
import { FixedClock, type InMemoryDeps } from '@microcks/demo-core/infrastructure/in-memory/shared';
import { createInMemoryTestingAdapters } from '@microcks/demo-core/infrastructure/in-memory/testing';

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
  const agents = createInMemoryAgentAdapters(deps);

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
  return { useCases, clock };
}

/** Shortcut for tests that only need the use cases. */
export function createUseCases(options: CompositionOptions = {}): UseCases {
  return createComposition(options).useCases;
}
