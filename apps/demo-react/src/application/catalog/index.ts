import type { Behavior, CommandItem, LabelCount, ServiceFilter, SimulationRequest, SimulationResult, WorkflowUsage } from '@/domain/catalog';
import type { Example, Operation, ServiceSummary } from '@/domain/shared';
import { NotFoundError } from '@/application/shared';
import type { ServiceCatalog } from '@/application/ports/catalog';

export type CatalogPorts = { catalog: ServiceCatalog };

export interface CatalogUseCases {
  listServices(filter?: ServiceFilter): Promise<ServiceSummary[]>;
  /** Throws `NotFoundError`. */
  getService(id: string): Promise<ServiceSummary>;
  labels(): Promise<LabelCount[]>;
  listOperations(serviceId: string): Promise<Operation[]>;
  getOperation(serviceId: string, operationId: string): Promise<Operation>;
  listExamples(serviceId: string, operationId: string): Promise<Example[]>;
  addExamples(serviceId: string, operationId: string, examples: Example[]): Promise<void>;
  /** Behavior (dispatcher, rules, delay, constraints) of an operation. */
  behavior(serviceId: string, operationId: string): Promise<Behavior>;
  saveBehavior(serviceId: string, operationId: string, behavior: Behavior): Promise<void>;
  /**
   * Which example would answer a request. Phase 1: exact parameter match only; WP7 replaces it with
   * the pure domain function `dispatch(request, behavior, examples)`.
   */
  simulate(serviceId: string, operationId: string, request: SimulationRequest): Promise<SimulationResult>;
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
    getService: (id) => need('Service', id, catalog.get(id)),
    labels: () => catalog.labels(),
    listOperations: async (serviceId) => {
      await need('Service', serviceId, catalog.get(serviceId));
      return catalog.operations(serviceId);
    },
    getOperation: (serviceId, operationId) => need('Operation', operationId, catalog.operation(serviceId, operationId)),
    listExamples: (serviceId, operationId) => catalog.examples(serviceId, operationId),
    addExamples: (serviceId, operationId, examples) => catalog.addExamples(serviceId, operationId, examples),
    behavior: (serviceId, operationId) => need('Behavior', operationId, catalog.behavior(serviceId, operationId)),
    saveBehavior: (serviceId, operationId, behavior) => catalog.saveBehavior(serviceId, operationId, behavior),
    simulate: async (serviceId, operationId, request) => {
      const examples = await catalog.examples(serviceId, operationId);
      const hit = examples.find((e) =>
        Object.entries(e.request.params).every(([k, v]) => request.params[k] === v),
      );
      return hit
        ? { matched: true, exampleId: hit.id, example: hit }
        : { matched: false, reason: 'No example matches this request.' };
    },
    workflowUsages: (serviceId) => catalog.workflowUsages(serviceId),
    commands: () => catalog.commands(),
  };
}
