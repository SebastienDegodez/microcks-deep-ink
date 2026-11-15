import {
  matchesRunKind,
  type ArazzoDocument,
  type ImportIssue,
  type RunKindFilter,
  type RunOptions,
  type RunOrigin,
  type RunTarget,
  type Session,
  type Workflow,
  type WorkflowExample,
  type WorkflowRun,
} from '../../domain/arazzo/index.js';
import type { SecretSummary } from '../../domain/shared/index.js';
import { NotFoundError, ValidationError, type Unsubscribe } from '../shared/index.js';
import type {
  ArazzoRepository,
  SessionRepository,
  WorkflowRunRepository,
  WorkflowRunner,
} from '../ports/arazzo.js';
import type { SecretRepository } from '../ports/importing.js';
import { defaultsFor, type RunFormDefaults, type RunScenario } from './run-scenarios.js';

export * from './run-scenarios.js';

export type ArazzoPorts = {
  documents: ArazzoRepository;
  runs: WorkflowRunRepository;
  runner: WorkflowRunner;
  sessions: SessionRepository;
  /** Secret names offered in the run form (cross-feature read through the port). */
  secrets: SecretRepository;
};

export interface WorkflowFilter {
  query?: string;
  /** Source description names; a workflow matches when it uses ANY of them. */
  sources?: string[];
  /** Result of the last run (restricted to `runKind`). */
  result?: 'all' | 'passed' | 'failed' | 'never';
  runKind?: RunKindFilter;
}

/** Row of the Workflows screen. */
export interface WorkflowListItem {
  workflow: Workflow;
  document: ArazzoDocument;
  /** Most recent run matching `filter.runKind`, if any. */
  lastRun?: WorkflowRun;
  /** Most recent call of the workflow Mock URL, whatever the filter ("Last call 2 d ago (run #11)"). */
  lastMockUrlRun?: { number: number; startedAt: string };
}

export interface WorkflowDetail {
  document: ArazzoDocument;
  workflow: Workflow;
}

export interface MockUrlInfo {
  method: 'POST';
  url: string;
  curl: string;
  /** e.g. "Last call 2 d ago (run #11)"; absent when never called. */
  lastCall?: { runNumber: number; at: string };
}

export interface RunSetup extends WorkflowDetail {
  /** All workflows of all documents, for the workflow Select (non runnable ones carry a note). */
  workflows: Workflow[];
  secrets: SecretSummary[];
  examples: WorkflowExample[];
  defaults: RunFormDefaults;
}

/** What the run form submits. Input values are strings as typed; the use case converts them. */
export interface StartRunInput {
  documentId: string;
  workflowId: string;
  target: 'mocks' | 'implementations' | 'mixed';
  baseUrls: Record<string, string>;
  perSource?: Record<string, 'mock' | 'implementation'>;
  secret?: string;
  /** Recorded example to play on the mocks. */
  example?: string;
  inputs: Record<string, string>;
  validateSchemas: boolean;
  timeoutMs: number;
  origin?: RunOrigin;
}

export interface ArazzoUseCases {
  listDocuments(): Promise<ArazzoDocument[]>;
  listWorkflows(filter?: WorkflowFilter): Promise<WorkflowListItem[]>;
  /** Links a source description to a catalogue API (the "Link a source" dialog). */
  linkSource(documentId: string, sourceName: string, serviceId: string): Promise<ArazzoDocument>;
  /** Throws `NotFoundError`. */
  getWorkflow(documentId: string, workflowId: string): Promise<WorkflowDetail>;
  /** Most recent first. */
  listRuns(documentId: string, workflowId: string, origin?: RunOrigin['kind']): Promise<WorkflowRun[]>;
  /** Throws `NotFoundError`. */
  getRun(runId: string): Promise<WorkflowRun>;
  validateDocument(documentId: string): Promise<ImportIssue[]>;
  getDocumentSource(documentId: string): Promise<string>;
  /** YAML of the ArazzoSources overlay, or `undefined` when the document has none. */
  getDocumentOverlay(documentId: string): Promise<string | undefined>;
  listSessions(documentId: string, workflowId: string): Promise<Session[]>;
  openSession(input: Parameters<ArazzoPorts['sessions']['open']>[0]): Promise<Session>;
  verifySession(sessionId: string): Promise<Session>;
  listExamples(documentId: string, workflowId: string): Promise<WorkflowExample[]>;
  getMockUrl(documentId: string, workflowId: string): Promise<MockUrlInfo>;
  /** Data of the run form. `scenario` selects one of the prototype presets. */
  getRunSetup(documentId: string, workflowId: string, scenario?: RunScenario): Promise<RunSetup>;
  /** Starts a run and returns its id. Throws `ValidationError` when the workflow cannot run. */
  startRun(input: StartRunInput): Promise<{ runId: string }>;
  /** Streams a run while it executes (tick 1200 ms); the last emission has a final status. */
  watchRun(runId: string, listener: (run: WorkflowRun) => void): Unsubscribe;
}

function convertInput(type: string, raw: string): unknown {
  if (type === 'number' || type === 'integer') return raw.trim() === '' ? undefined : Number(raw);
  if (type === 'boolean') return raw === 'true';
  return raw;
}

function toTarget(input: StartRunInput): RunTarget {
  switch (input.target) {
    case 'mocks':
      return { kind: 'mocks' };
    case 'implementations':
      return { kind: 'implementations', baseUrls: input.baseUrls };
    case 'mixed':
      return { kind: 'mixed', perSource: input.perSource ?? {}, proposed: true };
  }
}

export function createArazzoUseCases(ports: ArazzoPorts): ArazzoUseCases {
  const detail = async (documentId: string, workflowId: string): Promise<WorkflowDetail> => {
    const [document, workflow] = await Promise.all([
      ports.documents.document(documentId),
      ports.documents.workflow(documentId, workflowId),
    ]);
    if (!document) throw new NotFoundError('Arazzo document', documentId);
    if (!workflow) throw new NotFoundError('Workflow', workflowId);
    return { document, workflow };
  };

  return {
    listDocuments: () => ports.documents.documents(),
    listWorkflows: async (filter = {}) => {
      const [documents, workflows, runs] = await Promise.all([
        ports.documents.documents(),
        ports.documents.workflows(),
        ports.runs.list(),
      ]);
      const q = (filter.query ?? '').trim().toLowerCase();
      const kind = filter.runKind ?? 'any';
      const items: WorkflowListItem[] = [];
      for (const workflow of workflows) {
        const document = documents.find((d) => d.id === workflow.documentId);
        if (!document) continue;
        const hay = [workflow.summary, workflow.workflowId, document.file, ...workflow.steps.map((s) => s.stepId)]
          .join(' ')
          .toLowerCase();
        if (q && !hay.includes(q)) continue;
        if (filter.sources?.length && !workflow.steps.some((s) => filter.sources?.includes(s.sourceName))) continue;
        const lastRun = runs
          .filter((r) => r.documentId === workflow.documentId && r.workflowId === workflow.workflowId && matchesRunKind(r, kind))
          .sort((a, b) => b.number - a.number)[0];
        const result = filter.result ?? 'all';
        const outcome = lastRun ? (lastRun.status === 'SUCCESS' ? 'passed' : 'failed') : 'never';
        if (result !== 'all' && outcome !== result) continue;
        const mockUrlRun = runs
          .filter((r) => r.documentId === workflow.documentId && r.workflowId === workflow.workflowId && r.origin.kind === 'mock-url')
          .sort((a, b) => b.number - a.number)[0];
        items.push({
          workflow,
          document,
          lastRun,
          lastMockUrlRun: mockUrlRun ? { number: mockUrlRun.number, startedAt: mockUrlRun.startedAt } : undefined,
        });
      }
      return items;
    },
    linkSource: (documentId, sourceName, serviceId) => ports.documents.linkSource(documentId, sourceName, serviceId),
    getWorkflow: detail,
    listRuns: async (documentId, workflowId, origin) => {
      const runs = await ports.runs.list({ documentId, workflowId, origin });
      return runs.sort((a, b) => b.number - a.number);
    },
    getRun: async (runId) => {
      const run = await ports.runs.get(runId);
      if (!run) throw new NotFoundError('Workflow run', runId);
      return run;
    },
    validateDocument: (documentId) => ports.documents.validate(documentId),
    getDocumentSource: (documentId) => ports.documents.source(documentId),
    getDocumentOverlay: (documentId) => ports.documents.overlay(documentId),
    listSessions: (documentId, workflowId) => ports.sessions.list(documentId, workflowId),
    openSession: (input) => ports.sessions.open(input),
    verifySession: (sessionId) => ports.sessions.verify(sessionId),
    listExamples: (documentId, workflowId) => ports.documents.examples(documentId, workflowId),
    getMockUrl: async (documentId, workflowId) => {
      const { workflow } = await detail(documentId, workflowId);
      const [runs, examples] = await Promise.all([
        ports.runs.list({ documentId, workflowId, origin: 'mock-url' }),
        ports.documents.examples(documentId, workflowId),
      ]);
      const last = runs.sort((a, b) => b.number - a.number)[0];
      // The curl uses the inputs of the first recorded example, else the example values of the workflow inputs.
      const body = examples[0]?.inputs ?? Object.fromEntries(workflow.inputs.filter((i) => i.example !== undefined).map((i) => [i.name, convertInput(i.type, i.example ?? '')]));
      return {
        method: 'POST',
        url: workflow.mockUrl,
        curl: `curl -X POST '${workflow.mockUrl}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(body)}'`,
        lastCall: last ? { runNumber: last.number, at: last.startedAt } : undefined,
      };
    },
    getRunSetup: async (documentId, workflowId, scenario) => {
      const base = await detail(documentId, workflowId);
      const [workflows, secrets, examples] = await Promise.all([
        ports.documents.workflows(),
        ports.secrets.list(),
        ports.documents.examples(documentId, workflowId),
      ]);
      return { ...base, workflows, secrets, examples, defaults: defaultsFor(base.workflow, scenario) };
    },
    startRun: async (input) => {
      const { workflow } = await detail(input.documentId, input.workflowId);
      if (!workflow.runnability.runnable) throw new ValidationError(workflow.runnability.message);
      const inputs: Record<string, unknown> = {};
      for (const def of workflow.inputs) {
        const value = convertInput(def.type, input.inputs[def.name] ?? '');
        if (value !== undefined) inputs[def.name] = value;
      }
      const options: RunOptions = {
        example: input.example || undefined,
        inputs,
        secret: input.secret || undefined,
        timeoutMs: input.timeoutMs,
        validateSchemas: input.validateSchemas,
      };
      const runId = await ports.runner.start({
        documentId: input.documentId,
        workflowId: input.workflowId,
        target: toTarget(input),
        origin: input.origin ?? { kind: 'ui' },
        options,
      });
      return { runId };
    },
    watchRun: (runId, listener) => ports.runner.watch(runId)(listener),
  };
}
