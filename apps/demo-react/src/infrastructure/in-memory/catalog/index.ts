import {
  filterServices,
  type Behavior,
  type CommandItem,
  type LabelCount,
  type ServiceFilter,
  type WorkflowUsage,
  type WorkflowUsageResult,
} from '@/domain/catalog';
import { labelToString, type Operation } from '@/domain/shared';
import type { CatalogExtensions } from '@/application/catalog';
import type { ServiceCatalog } from '@/application/ports/catalog';
import {
  DOCUMENTS,
  OPERATIONS,
  WORKFLOWS,
  after,
  seedRuns,
  FixedClock,
  type InMemoryDeps,
} from '../shared';
import { defaultBehavior } from './seed/behaviors';
import { buildDetails } from './seed/details';
import { seedExamples } from './seed/examples';
import { CATALOG_SERVICES } from './seed/services';

export interface CatalogAdapters {
  catalog: ServiceCatalog & CatalogExtensions;
}

const PAGE_COMMANDS: CommandItem[] = [
  { id: 'page-cockpit', label: 'Cockpit', kind: 'Page', href: '/' },
  { id: 'page-import', label: 'Add a source', kind: 'Page', href: '/sources/new' },
  { id: 'page-sources', label: 'Sources', kind: 'Page', href: '/sources' },
  { id: 'page-workflows', label: 'Workflows', kind: 'Page', href: '/workflows' },
  { id: 'page-tests', label: 'Tests', kind: 'Page', href: '/tests' },
  { id: 'page-traces', label: 'Live traces', kind: 'Page', href: '/traces' },
];

/** Catalogue operation a workflow step resolves to (`GetPastryByName` of apiPastry → `get-name`). */
const OPERATION_BY_ARAZZO_ID: Record<string, string> = { GetPastries: 'get-list', GetPastryByName: 'get-name', PatchPastry: 'patch-name' };

/** Last run of each workflow that happened before the demo clock (#14 restock-pastry, #3 check-menu...). */
function lastRunResult(documentId: string, workflowId: string, now: Date): WorkflowUsageResult | undefined {
  const runs = seedRuns()
    .filter((r) => r.documentId === documentId && r.workflowId === workflowId && new Date(r.startedAt) <= now)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const run = runs[0];
  if (!run) return undefined;
  return {
    kind: run.status === 'SUCCESS' ? 'passed' : 'failed',
    runNumber: run.number,
    runId: run.id,
    target: run.target.kind,
    at: run.startedAt,
  };
}

/** In-memory catalogue: the 10 services, their operations, examples, behaviors, details and workflow usages. */
export function createInMemoryCatalogAdapters(deps: InMemoryDeps = {}): CatalogAdapters {
  const clock = deps.clock ?? new FixedClock();
  const examples = seedExamples();
  const behaviors = new Map<string, Behavior>();

  const operationsOf = (id: string): Operation[] => OPERATIONS[id] ?? [];

  const catalog: ServiceCatalog & CatalogExtensions = {
    list: (filter: ServiceFilter = {}) => after(() => filterServices(CATALOG_SERVICES, filter)),
    get: (id) => after(() => CATALOG_SERVICES.find((s) => s.id === id)),
    operations: (id) => after(() => operationsOf(id)),
    operation: (id, opId) => after(() => operationsOf(id).find((o) => o.id === opId)),
    examples: (id, opId) => after(() => (examples.get(`${id}/${opId}`) ?? []).map((e) => ({ ...e }))),
    addExamples: (id, opId, list) =>
      after(() => {
        const key = `${id}/${opId}`;
        const current = examples.get(key) ?? [];
        const ids = new Set(list.map((e) => e.id));
        // Keep the position of an example that is replaced (a pending proposal that becomes accepted).
        const replaced = current.map((e) => list.find((n) => n.id === e.id) ?? e);
        examples.set(key, [...replaced, ...list.filter((e) => !current.some((c) => c.id === e.id) && ids.has(e.id))]);
      }),
    removeExample: (id, opId, exampleId) =>
      after(() => {
        const key = `${id}/${opId}`;
        examples.set(key, (examples.get(key) ?? []).filter((e) => e.id !== exampleId));
      }),
    behavior: (id, opId) =>
      after(() => {
        const saved = behaviors.get(`${id}/${opId}`);
        if (saved) return saved;
        const op = operationsOf(id).find((o) => o.id === opId);
        return op ? defaultBehavior(id, op) : undefined;
      }),
    saveBehavior: (id, opId, behavior) =>
      after(() => {
        behaviors.set(`${id}/${opId}`, behavior);
      }),
    workflowUsages: (id) =>
      after(() => {
        const usages: WorkflowUsage[] = [];
        for (const doc of DOCUMENTS) {
          const sources = doc.sources.filter((s) => s.link.status === 'linked' && s.link.serviceId === id).map((s) => s.name);
          if (sources.length === 0) continue;
          for (const wf of WORKFLOWS.filter((w) => w.documentId === doc.id)) {
            const steps = wf.steps.filter((s) => sources.includes(s.sourceName));
            if (steps.length === 0) continue;
            const result: WorkflowUsageResult | undefined = wf.runnability.runnable
              ? (lastRunResult(doc.id, wf.workflowId, clock.now()) ?? { kind: 'never' })
              : { kind: 'blocked', reason: 'Cannot run yet · AsyncAPI steps' };
            usages.push({
              documentId: doc.id,
              workflowId: wf.workflowId,
              summary: wf.summary,
              stepIds: steps.map((s) => s.stepId),
              steps: steps.map((s) => ({ stepId: s.stepId, operationId: s.operationId, catalogOperationId: OPERATION_BY_ARAZZO_ID[s.operationId] })),
              result,
            });
          }
        }
        return usages;
      }),
    details: (id) =>
      after(() => {
        const service = CATALOG_SERVICES.find((s) => s.id === id);
        return service ? buildDetails(service, operationsOf(id)) : undefined;
      }),
    labels: () =>
      after(() => {
        const counts = new Map<string, LabelCount>();
        for (const s of CATALOG_SERVICES) {
          for (const label of s.labels) {
            const key = labelToString(label);
            const entry = counts.get(key) ?? { label, count: 0 };
            entry.count += 1;
            counts.set(key, entry);
          }
        }
        return [...counts.values()].sort((a, b) => labelToString(a.label).localeCompare(labelToString(b.label)));
      }),
    commands: () =>
      after(() => [
        ...PAGE_COMMANDS,
        ...CATALOG_SERVICES.map((s) => ({ id: `service-${s.id}`, label: `${s.name} ${s.version}`, kind: 'Service', hint: s.protocol, href: `/services/${s.id}` })),
        ...WORKFLOWS.map((w) => ({ id: `workflow-${w.workflowId}`, label: w.summary, kind: 'Workflow', hint: w.workflowId, href: `/workflows/${w.documentId}/${w.workflowId}` })),
      ]),
  };
  return { catalog };
}

