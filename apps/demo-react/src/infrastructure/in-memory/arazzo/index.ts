import type { Session } from '@/domain/arazzo';
import { verificationRun, verifySession, type ArazzoDocument, type Workflow } from '@/domain/arazzo';
import type {
  ArazzoRepository,
  RunFilter,
  SessionRepository,
  WorkflowRunRepository,
  WorkflowRunner,
} from '@/application/ports/arazzo';
import { NotFoundError } from '@/application/shared';
import {
  DOCUMENTS,
  EXAMPLES,
  FixedClock,
  MOCK_BASE,
  PASTRY_ARAZZO_YAML,
  PASTRY_OVERLAY_YAML,
  SERVICES,
  WORKFLOWS,
  after,
  scenarioRun,
  scenarioRuns,
  seedRuns,
  seedSessions,
  type InMemoryDeps,
} from '../shared';
import { createRunner } from './runner';
import { createArazzoState } from './run-store';

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
 * In-memory Arazzo adapters over the shared seed (2 documents, 5 workflows, the 5 seeded runs (+ #15, #16 on their scenario), 3 sessions,
 * 2 examples). The runner is a real simulation (see `runner.ts` and `world.ts`); sessions are verified against
 * the workflow (`verifySession`) and a verification creates a run with the origin "session".
 */
export function createInMemoryArazzoAdapters(deps: InMemoryDeps = {}): ArazzoAdapters {
  const clock = deps.clock ?? new FixedClock();
  const documents = DOCUMENTS.map((d): ArazzoDocument => ({ ...d, sources: d.sources.map((s) => ({ ...s })) }));
  const workflows = WORKFLOWS.map((w): Workflow => ({ ...w }));
  const state = createArazzoState({ runs: seedRuns(), reserved: scenarioRuns(), sessions: seedSessions(), workflows });

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
        const service = SERVICES.find((s) => s.id === serviceId);
        if (!service) throw new NotFoundError('Service', serviceId);
        const used = new Set(workflows.filter((w) => w.documentId === doc.id).flatMap((w) => w.steps).filter((s) => s.sourceName === sourceName).map((s) => s.operationId));
        const found = Math.min(used.size, service.operationCount) || service.operationCount;
        source.link = { status: 'linked', serviceId, protocol: service.protocol, operationsFound: `${found} of ${used.size || found} found` };
        if (doc.sources.every((s) => s.link.status === 'linked')) {
          workflows.forEach((w, i) => {
            if (w.documentId === doc.id && w.runnability.runnable === false && w.runnability.reason === 'source-not-linked') {
              workflows[i] = { ...w, runnability: { runnable: true } };
            }
          });
        }
        return doc;
      }),
    validate: (documentId) => after(() => documents.find((d) => d.id === documentId)?.importIssues ?? []),
    source: (documentId) => after(() => (documentId === 'pastry' ? PASTRY_ARAZZO_YAML : BEER_YAML)),
    overlay: (documentId) => after(() => (documentId === 'pastry' ? PASTRY_OVERLAY_YAML : undefined)),
    examples: (_documentId, workflowId) => after(() => EXAMPLES.filter((e) => e.workflowId === workflowId)),
  };

  const runRepo: WorkflowRunRepository = {
    list: (filter: RunFilter = {}) =>
      after(() =>
        state.runs.filter(
          (r) =>
            (!filter.documentId || r.documentId === filter.documentId) &&
            (!filter.workflowId || r.workflowId === filter.workflowId) &&
            (!filter.origin || r.origin.kind === filter.origin),
        ),
      ),
    // Runs #15 and #16 are reachable by id (the scenario links of the run page) before their scenario is launched,
    // but stay out of the lists until then.
    get: (id) => after(() => state.runs.find((r) => r.id === id) ?? scenarioRun(id)),
    save: (run) =>
      after(() => {
        const at = state.runs.findIndex((r) => r.id === run.id);
        if (at >= 0) state.runs[at] = run;
        else state.runs.push(run);
      }),
  };

  const sessionRepo: SessionRepository = {
    list: (documentId, workflowId) => after(() => state.sessions.filter((s) => s.documentId === documentId && s.workflowId === workflowId)),
    get: (id) => after(() => state.sessions.find((s) => s.id === id)),
    open: (input) =>
      after(() => {
        const created: Session = {
          id: state.newSessionId(),
          app: input.app,
          documentId: input.documentId,
          workflowId: input.workflowId,
          state: 'open',
          openedAt: clock.now().toISOString(),
          inputs: input.inputs,
          failureInjection: input.failureInjection,
          calls: [],
        };
        state.sessions.unshift(created);
        return created;
      }),
    verify: (id) =>
      after(() => {
        const found = state.sessions.find((s) => s.id === id);
        if (!found) throw new NotFoundError('Session', id);
        if (found.verification) return found;
        const workflow = workflows.find((w) => w.documentId === found.documentId && w.workflowId === found.workflowId);
        if (!workflow) throw new NotFoundError('Workflow', found.workflowId);
        const verdict = verifySession(found, workflow);
        const number = state.nextNumber(found.documentId, found.workflowId);
        state.runs.push(
          verificationRun(found, workflow, verdict, { runId: state.newRunId(), number, baseUrl: MOCK_BASE, startedAt: clock.now().toISOString() }),
        );
        found.state = 'closed';
        found.verification = { result: verdict.result, runNumber: number, problems: verdict.problems };
        return found;
      }),
  };

  return { documents: repo, runs: runRepo, runner: createRunner(state, clock), sessions: sessionRepo };
}
