import type { ArazzoDocument, Session, Workflow, WorkflowRun } from '@/domain/arazzo';
import type {
  ArazzoRepository,
  RunFilter,
  SessionRepository,
  StartRunRequest,
  WorkflowRunRepository,
  WorkflowRunner,
} from '@/application/ports/arazzo';
import { NotFoundError } from '@/application/shared';
import {
  DOCUMENTS,
  EXAMPLES,
  PASTRY_ARAZZO_YAML,
  RUN_IDS,
  WORKFLOWS,
  after,
  createSequenceStream,
  seedRuns,
  seedSessions,
  type InMemoryDeps,
} from '../shared';

export interface ArazzoAdapters {
  documents: ArazzoRepository;
  runs: WorkflowRunRepository;
  runner: WorkflowRunner;
  sessions: SessionRepository;
}

const BEER_YAML = [
  'arazzo: 1.0.1',
  'info:',
  '  title: Beer checkout',
  '  version: 0.3.0',
  'sourceDescriptions:',
  '  - name: beerCatalog',
  '    url: ./beer-catalog-1.0-openapi.yaml',
  '    type: openapi',
  'workflows:',
  '  - workflowId: checkout-beer',
  '    # findBeer, getBeer, reserveBeer',
].join('\n');

/**
 * In-memory Arazzo adapters. Phase 1 serves the shared seed (documents, workflows, the 7 seeded runs,
 * 3 sessions, 2 examples). WP8 replaces the runner stub with a real simulation built on the domain
 * `playWorkflow` and fills the details of each screen.
 */
export function createInMemoryArazzoAdapters(_deps: InMemoryDeps = {}): ArazzoAdapters {
  const documents = DOCUMENTS.map((d): ArazzoDocument => ({ ...d, sources: d.sources.map((s) => ({ ...s })) }));
  const workflows = WORKFLOWS.map((w): Workflow => ({ ...w }));
  const runs = seedRuns();
  const sessions = seedSessions();

  const repo: ArazzoRepository = {
    documents: () => after(() => documents),
    document: (id) => after(() => documents.find((d) => d.id === id)),
    workflows: (documentId) => after(() => workflows.filter((w) => !documentId || w.documentId === documentId)),
    workflow: (documentId, workflowId) => after(() => workflows.find((w) => w.documentId === documentId && w.workflowId === workflowId)),
    linkSource: (documentId, sourceName, serviceId) =>
      after(() => {
        const doc = documents.find((d) => d.id === documentId);
        const source = doc?.sources.find((s) => s.name === sourceName);
        if (!doc || !source) throw new NotFoundError('Source description', sourceName);
        source.link = { status: 'linked', serviceId, protocol: 'REST', operationsFound: '3 of 3 found' };
        if (doc.sources.every((s) => s.link.status === 'linked')) {
          workflows.forEach((w, i) => {
            if (w.documentId === doc.id && w.runnability.runnable === false && w.runnability.reason === 'source-not-linked') {
              workflows[i] = { ...w, runnability: { runnable: true } };
            }
          });
        }
        return doc;
      }),
    validate: (documentId) => after(() => (documents.find((d) => d.id === documentId)?.importIssues ?? [])),
    source: (documentId) => after(() => (documentId === 'pastry' ? PASTRY_ARAZZO_YAML : BEER_YAML)),
    examples: (_documentId, workflowId) => after(() => EXAMPLES.filter((e) => e.workflowId === workflowId)),
  };

  const runRepo: WorkflowRunRepository = {
    list: (filter: RunFilter = {}) =>
      after(() =>
        runs.filter(
          (r) =>
            (!filter.documentId || r.documentId === filter.documentId) &&
            (!filter.workflowId || r.workflowId === filter.workflowId) &&
            (!filter.origin || r.origin.kind === filter.origin),
        ),
      ),
    get: (id) => after(() => runs.find((r) => r.id === id)),
    save: (run) =>
      after(() => {
        const at = runs.findIndex((r) => r.id === run.id);
        if (at >= 0) runs[at] = run;
        else runs.push(run);
      }),
  };

  /** Phase-1 stub: starts nothing, returns the seeded run that matches the request. */
  const pickRun = (request: StartRunRequest): string => {
    if (request.workflowId === 'check-menu') return RUN_IDS.checkMenu3;
    if (request.target.kind === 'implementations') return RUN_IDS[14];
    if (request.options.example === 'already-available') return RUN_IDS[15];
    if (!request.options.example && request.options.inputs.size === 'S') return RUN_IDS[16];
    return RUN_IDS[12];
  };

  const runner: WorkflowRunner = {
    start: (request) => after(() => pickRun(request)),
    watch: (runId) => {
      const run = runs.find((r) => r.id === runId);
      if (!run) throw new NotFoundError('Workflow run', runId);
      const frames: WorkflowRun[] = [];
      const ran = run.steps.filter((s) => s.status !== 'not-run').length;
      for (let k = 1; k < ran; k++) {
        frames.push({ ...run, status: 'RUNNING', steps: run.steps.map((s, i) => (i < k ? s : { ...s, status: 'not-run' as const, attempts: [] })) });
      }
      frames.push(run);
      return createSequenceStream(frames);
    },
  };

  const sessionRepo: SessionRepository = {
    list: (documentId, workflowId) => after(() => sessions.filter((s) => s.documentId === documentId && s.workflowId === workflowId)),
    get: (id) => after(() => sessions.find((s) => s.id === id)),
    open: (input) =>
      after(() => {
        const created: Session = {
          id: `s-${(0x2b91e04d + sessions.length * 7919).toString(16).slice(-8)}`,
          app: input.app, documentId: input.documentId, workflowId: input.workflowId, state: 'open',
          openedAt: '2026-11-03T09:10:04Z', inputs: input.inputs, failureInjection: input.failureInjection, calls: [],
        };
        sessions.unshift(created);
        return created;
      }),
    verify: (id) =>
      after(() => {
        const found = sessions.find((s) => s.id === id);
        if (!found) throw new NotFoundError('Session', id);
        if (!found.verification) {
          found.state = 'closed';
          found.verification = { result: 'SUCCESS', runNumber: 17, problems: [] };
        }
        return found;
      }),
  };

  return { documents: repo, runs: runRepo, runner, sessions: sessionRepo };
}
