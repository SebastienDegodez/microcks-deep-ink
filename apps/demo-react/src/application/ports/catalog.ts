import type { Behavior, CommandItem, LabelCount, ServiceFilter, WorkflowUsage } from '@/domain/catalog';
import type { Example, Operation, ServiceSummary } from '@/domain/shared';

export interface ServiceCatalog {
  list(filter?: ServiceFilter): Promise<ServiceSummary[]>;
  get(id: string): Promise<ServiceSummary | undefined>;
  operations(id: string): Promise<Operation[]>;
  operation(id: string, opId: string): Promise<Operation | undefined>;
  examples(id: string, opId: string): Promise<Example[]>;
  addExamples(id: string, opId: string, examples: Example[]): Promise<void>;
  behavior(id: string, opId: string): Promise<Behavior | undefined>;
  saveBehavior(id: string, opId: string, behavior: Behavior): Promise<void>;
  /** Workflows (Arazzo) that call the service. */
  workflowUsages(id: string): Promise<WorkflowUsage[]>;
  labels(): Promise<LabelCount[]>;
  /** Entries of the ⌘K command bar. */
  commands(): Promise<CommandItem[]>;
}
