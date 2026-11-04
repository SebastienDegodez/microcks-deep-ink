import {
  dispatch,
  facetCounts,
  filterServices,
  type Behavior,
  type CommandItem,
  type LabelCount,
  type ServiceDetails,
  type ServiceFacets,
  type ServiceFilter,
  type SimulationRequest,
  type SimulationResult,
  type WorkflowUsage,
} from '@/domain/catalog';
import type { Example, Operation, ServiceSummary } from '@/domain/shared';
import { NotFoundError } from '@/application/shared';
import type { ServiceCatalog } from '@/application/ports/catalog';

/**
 * Capabilities of the catalogue adapter beyond the `ServiceCatalog` port (which is owned by the foundation
 * and read-only in phase 2). The adapter implements `ServiceCatalog & CatalogExtensions`.
 */
export interface CatalogExtensions {
  /** Properties, artifacts and MCP endpoints of a service. */
  details(id: string): Promise<ServiceDetails | undefined>;
  removeExample(id: string, opId: string, exampleId: string): Promise<void>;
}

export type CatalogPorts = { catalog: ServiceCatalog & CatalogExtensions };

/** The catalogue screen: filtered rows plus the counts of the filter chips. */
export interface CatalogView {
  services: ServiceSummary[];
  total: number;
  operationsTotal: number;
  /** Number of distinct workflows that call a service of the catalogue ("used by 4 workflows"). */
  workflowsUsing: number;
  facets: ServiceFacets;
}

export interface CatalogUseCases {
  listServices(filter?: ServiceFilter): Promise<ServiceSummary[]>;
  /** Filtered rows, totals and the counts of every filter chip, in one read. */
  browse(filter?: ServiceFilter): Promise<CatalogView>;
  /** Throws `NotFoundError`. */
  getService(id: string): Promise<ServiceSummary>;
  /** Properties & MCP tab and header facts. Throws `NotFoundError`. */
  getServiceDetails(id: string): Promise<ServiceDetails>;
  labels(): Promise<LabelCount[]>;
  listOperations(serviceId: string): Promise<Operation[]>;
  getOperation(serviceId: string, operationId: string): Promise<Operation>;
  listExamples(serviceId: string, operationId: string): Promise<Example[]>;
  addExamples(serviceId: string, operationId: string, examples: Example[]): Promise<void>;
  removeExample(serviceId: string, operationId: string, exampleId: string): Promise<void>;
  /** Behavior (dispatcher, rules, delay, constraints) of an operation. */
  behavior(serviceId: string, operationId: string): Promise<Behavior>;
  saveBehavior(serviceId: string, operationId: string, behavior: Behavior): Promise<void>;
  /**
   * Which example would answer a request: the pure domain function `dispatch(request, behavior, examples)`.
   * `draft` simulates the configuration being edited on the Behavior screen instead of the saved one.
   */
  simulate(serviceId: string, operationId: string, request: SimulationRequest, draft?: Behavior): Promise<SimulationResult>;
  workflowUsages(serviceId: string): Promise<WorkflowUsage[]>;
  /** Entries of the ⌘K command bar. */
  commands(): Promise<CommandItem[]>;
}

export function createCatalogUseCases({ catalog }: CatalogPorts): CatalogUseCases {
  const need = async <T>(entity: string, id: string, read: Promise<T | undefined>): Promise<T> => {
    const found = await read;
    if (found === undefined) throw new NotFoundError(entity, id);
    return found;
  };
  return {
    listServices: (filter) => catalog.list(filter),
    browse: async (filter = {}) => {
      const all = await catalog.list();
      const usages = await Promise.all(all.map((s) => catalog.workflowUsages(s.id)));
      const workflows = new Set(usages.flat().map((u) => `${u.documentId}/${u.workflowId}`));
      return {
        // "sort: recently updated": newest first.
        services: filterServices(all, filter).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        total: all.length,
        operationsTotal: all.reduce((n, s) => n + s.operationCount, 0),
        workflowsUsing: workflows.size,
        facets: facetCounts(all, filter),
      };
    },
    getService: (id) => need('Service', id, catalog.get(id)),
    getServiceDetails: (id) => need('Service', id, catalog.details(id)),
    labels: () => catalog.labels(),
    listOperations: async (serviceId) => {
      await need('Service', serviceId, catalog.get(serviceId));
      return catalog.operations(serviceId);
    },
    getOperation: (serviceId, operationId) => need('Operation', operationId, catalog.operation(serviceId, operationId)),
    listExamples: (serviceId, operationId) => catalog.examples(serviceId, operationId),
    addExamples: (serviceId, operationId, examples) => catalog.addExamples(serviceId, operationId, examples),
    removeExample: (serviceId, operationId, exampleId) => catalog.removeExample(serviceId, operationId, exampleId),
    behavior: (serviceId, operationId) => need('Behavior', operationId, catalog.behavior(serviceId, operationId)),
    saveBehavior: (serviceId, operationId, behavior) => catalog.saveBehavior(serviceId, operationId, behavior),
    simulate: async (serviceId, operationId, request, draft) => {
      const [operation, examples, saved] = await Promise.all([
        need('Operation', operationId, catalog.operation(serviceId, operationId)),
        catalog.examples(serviceId, operationId),
        draft ? Promise.resolve(draft) : need('Behavior', operationId, catalog.behavior(serviceId, operationId)),
      ]);
      // A pending AI example is not served until it is accepted.
      const served = examples.filter((e) => e.reviewState !== 'pending');
      return dispatch(request, saved, served, { method: operation.method, path: operation.path });
    },
    workflowUsages: (serviceId) => catalog.workflowUsages(serviceId),
    commands: () => catalog.commands(),
  };
}
