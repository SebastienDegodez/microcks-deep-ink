import type { Behavior, CommandItem, LabelCount, ServiceFilter, WorkflowUsage } from '@/domain/catalog';
import { labelToString, type Example } from '@/domain/shared';
import type { ServiceCatalog } from '@/application/ports/catalog';
import {
  DOCUMENTS,
  OPERATIONS,
  PASTRY2_BEHAVIOR_DEFAULT,
  PASTRY2_EXAMPLES,
  SERVICES,
  WORKFLOWS,
  after,
  type InMemoryDeps,
} from '../shared';

export interface CatalogAdapters {
  catalog: ServiceCatalog;
}

const PAGE_COMMANDS: CommandItem[] = [
  { id: 'page-cockpit', label: 'Cockpit', kind: 'Page', href: '/' },
  { id: 'page-import', label: 'Import a contract', kind: 'Page', href: '/import' },
  { id: 'page-workflows', label: 'Workflows', kind: 'Page', href: '/workflows' },
  { id: 'page-tests', label: 'Tests', kind: 'Page', href: '/tests' },
  { id: 'page-traces', label: 'Live traces', kind: 'Page', href: '/traces' },
];

/** In-memory catalogue. WP7 enriches the seeds (operations, examples, behaviors) of the other services. */
export function createInMemoryCatalogAdapters(_deps: InMemoryDeps = {}): CatalogAdapters {
  const examples = new Map<string, Example[]>(
    Object.entries(PASTRY2_EXAMPLES).map(([opId, list]) => [`pastry2/${opId}`, list.map((e) => ({ ...e }))]),
  );
  const behaviors = new Map<string, Behavior>();

  const catalog: ServiceCatalog = {
    list: (filter: ServiceFilter = {}) =>
      after(() => {
        const q = (filter.query ?? '').trim().toLowerCase();
        return SERVICES.filter((s) => {
          if (q && !`${s.name} ${s.version}`.toLowerCase().includes(q)) return false;
          if (filter.protocols?.length && !filter.protocols.includes(s.protocol)) return false;
          if (filter.labels?.length && !filter.labels.every((l) => s.labels.some((x) => labelToString(x) === l))) return false;
          if (filter.testStatus && filter.testStatus !== 'all' && s.testStatus !== filter.testStatus) return false;
          return true;
        });
      }),
    get: (id) => after(() => SERVICES.find((s) => s.id === id)),
    operations: (id) => after(() => OPERATIONS[id] ?? []),
    operation: (id, opId) => after(() => (OPERATIONS[id] ?? []).find((o) => o.id === opId)),
    examples: (id, opId) => after(() => (examples.get(`${id}/${opId}`) ?? []).map((e) => ({ ...e }))),
    addExamples: (id, opId, list) =>
      after(() => {
        const key = `${id}/${opId}`;
        const current = examples.get(key) ?? [];
        const ids = new Set(list.map((e) => e.id));
        examples.set(key, [...current.filter((e) => !ids.has(e.id)), ...list]);
      }),
    behavior: (id, opId) =>
      after(() => {
        const saved = behaviors.get(`${id}/${opId}`);
        if (saved) return saved;
        const op = (OPERATIONS[id] ?? []).find((o) => o.id === opId);
        return op ? { ...PASTRY2_BEHAVIOR_DEFAULT, dispatcher: op.dispatcher, rule: op.rule, delayMs: op.delayMs } : undefined;
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
            const stepIds = wf.steps.filter((s) => sources.includes(s.sourceName)).map((s) => s.stepId);
            if (stepIds.length) usages.push({ documentId: doc.id, workflowId: wf.workflowId, summary: wf.summary, stepIds });
          }
        }
        return usages;
      }),
    labels: () =>
      after(() => {
        const counts = new Map<string, LabelCount>();
        for (const s of SERVICES) {
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
        ...SERVICES.map((s) => ({ id: `service-${s.id}`, label: `${s.name} ${s.version}`, kind: 'Service', hint: s.protocol, href: `/services/${s.id}` })),
        ...WORKFLOWS.map((w) => ({ id: `workflow-${w.workflowId}`, label: w.summary, kind: 'Workflow', hint: w.workflowId, href: `/workflows/${w.documentId}/${w.workflowId}` })),
      ]),
  };
  return { catalog };
}
