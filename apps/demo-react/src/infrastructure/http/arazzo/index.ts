/**
 * HTTP adapters of the arazzo feature. Proposition v2 / not in Microcks API: Microcks API v1.x has no Arazzo
 * endpoint. Every path below lives under `/api/arazzo/...`, the prefix of the POC on the maintainer's fork
 * (https://github.com/SebastienDegodez/microcks/tree/feature/arazzo, `webapp/src/main/java/io/github/microcks/web/`):
 *
 * Aligned with the POC (`Arazzo{Document,Workflow,Run,RunHistory,Session,MockUrl}Controller`):
 * - `GET /arazzo/documents`: `documents()`, `document(id)` (found in the list) and the workflow ids of `workflows()`;
 * - `GET /arazzo/documents/{documentId}/workflows/{workflowId}`: `workflow()`, and each workflow of `workflows()`;
 * - `PUT /arazzo/documents/{documentId}/sources` (`ArazzoLinksRequest`): `linkSource()`, then the document is read again;
 * - `POST /arazzo/documents/{documentId}/analysis` (`ArazzoImportAnalysis`): `validate()`;
 * - `GET /arazzo/documents/{documentId}/runs?workflow=`: `runs.list()`, once per document when none is given;
 * - `POST /arazzo/documents/{documentId}/workflows/{workflowId}/runs` (`ArazzoRunLaunchDTO`): `runner.start()`,
 *   which reads the `id` of the run in the answer;
 * - `GET /arazzo/runs/{runId}`: `runs.get()`;
 * - `POST /arazzo/sessions` (`ArazzoSessionRequest`) and `POST /arazzo/sessions/{sessionId}/verification`:
 *   `sessions.open()` and `sessions.verify()` (the POC answers a verification with the run; the session is read again);
 * - mock URL: `POST <microcks>/arazzo/{documentTitle}/{documentVersion}/{workflowId}` (outside `/api`), the
 *   `mockUrl` of a workflow, built from its document when the answer has none.
 *
 * Demo-only, beyond the POC: the `origin` query of the run list and the `origin`/`mixed` target of a launch,
 * `PUT /arazzo/runs/{runId}` (`runs.save()`), `GET /arazzo/documents/{documentId}/{source,overlay}` (YAML, text/plain),
 * `GET /arazzo/documents/{documentId}/workflows/{workflowId}/examples`, `GET /arazzo/sessions?document=&workflow=` and
 * `GET /arazzo/sessions/{sessionId}`, and the progress feed below.
 *
 * Run progress (`runner.watch`): no SSE nor WebSocket is invented. Each subscription polls
 * `GET /arazzo/runs/{runId}/progress?after=<last seq>&limit=1` with the self-scheduling `pollingStream`
 * (`src/infrastructure/http/polling.ts`: one request in flight at most, the next one 1200 ms after the previous one
 * settles, the first one right away, as the in-memory runner ticks), and stops after the frame with a final status.
 * A backend without that feed (404) is read with `GET /arazzo/runs/{runId}` instead, a frame each time the run changed;
 * an unknown run ends the stream without emitting.
 */
import type { ArazzoDocument, WorkflowRun } from '@/domain/arazzo';
import type { ArazzoRepository, SessionRepository, WorkflowRunner, WorkflowRunRepository } from '@/application/ports/arazzo';
import type { Clock } from '@/application/ports/shared';
import { NotFoundError } from '@/application/shared';
import { defaultApiBaseUrl, type HttpClient } from '@/infrastructure/http/client';
import { pollingStream } from '@/infrastructure/http/polling';
import type { ArazzoDocumentDto, ArazzoImportAnalysisDto, ArazzoRunDto, ArazzoRunFrameDto, ArazzoSessionDto, ArazzoWorkflowDto, ArazzoWorkflowExampleDto } from './dto';
import { matchesRunFilter, toDocument, toImportIssues, toLaunch, toLinksRequest, toRun, toRunsQuery, toSession, toSessionRequest, toWorkflow } from './mapping';

export interface HttpArazzoDeps {
  http: HttpClient;
  clock: Clock;
  /** Root of Microcks, for the mock URLs the answers lack. Defaults to the directory above the API base. */
  microcksBase?: string;
}

export interface HttpArazzoAdapters {
  documents: ArazzoRepository;
  runs: WorkflowRunRepository;
  runner: WorkflowRunner;
  sessions: SessionRepository;
}

/** Same pace as the in-memory runner. */
export const RUN_POLL_MS = 1200;

/** `undefined` for a 404, the error otherwise. */
async function orUndefined<T>(request: Promise<T>): Promise<T | undefined> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof NotFoundError) return undefined;
    throw error;
  }
}

export function createHttpArazzoAdapters({ http, microcksBase = new URL('..', defaultApiBaseUrl()).href }: HttpArazzoDeps): HttpArazzoAdapters {
  const enc = encodeURIComponent;
  const docPath = (documentId: string) => `arazzo/documents/${enc(documentId)}`;
  const workflowPath = (documentId: string, workflowId: string) => `${docPath(documentId)}/workflows/${enc(workflowId)}`;

  const listDocuments = async (): Promise<ArazzoDocument[]> => (await http.get<ArazzoDocumentDto[]>('arazzo/documents')).map(toDocument);
  const findDocument = async (id: string) => (await listDocuments()).find((d) => d.id === id);

  async function readWorkflow(document: ArazzoDocument | undefined, documentId: string, workflowId: string) {
    const dto = await orUndefined(http.get<ArazzoWorkflowDto>(workflowPath(documentId, workflowId)));
    return dto && toWorkflow(dto, document, microcksBase);
  }

  const documents: ArazzoRepository = {
    documents: listDocuments,
    document: findDocument,
    async workflows(documentId) {
      const all = (await listDocuments()).filter((d) => !documentId || d.id === documentId);
      const found = await Promise.all(all.flatMap((d) => d.workflowIds.map((w) => readWorkflow(d, d.id, w))));
      return found.filter((w) => w !== undefined);
    },
    async workflow(documentId, workflowId) {
      return readWorkflow(await findDocument(documentId), documentId, workflowId);
    },
    async linkSource(documentId, sourceName, serviceId) {
      await http.put(`${docPath(documentId)}/sources`, toLinksRequest(sourceName, serviceId));
      const document = await findDocument(documentId);
      if (!document) throw new NotFoundError('Arazzo document', documentId);
      return document;
    },
    validate: async (documentId) => toImportIssues(await orUndefined(http.post<ArazzoImportAnalysisDto>(`${docPath(documentId)}/analysis`, { links: null }))),
    source: (documentId) => http.get<string>(`${docPath(documentId)}/source`),
    overlay: (documentId) => orUndefined(http.get<string>(`${docPath(documentId)}/overlay`)),
    examples: async (documentId, workflowId) => (await orUndefined(http.get<ArazzoWorkflowExampleDto[]>(`${workflowPath(documentId, workflowId)}/examples`))) ?? [],
  };

  const runs: WorkflowRunRepository = {
    async list(filter = {}) {
      const ids = filter.documentId ? [filter.documentId] : (await listDocuments()).map((d) => d.id);
      const pages = await Promise.all(ids.map((id) => orUndefined(http.get<ArazzoRunDto[]>(`${docPath(id)}/runs`, { query: toRunsQuery(filter) }))));
      return pages.flatMap((page) => page ?? []).map(toRun).filter((r) => matchesRunFilter(r, filter));
    },
    get: async (runId) => {
      const dto = await orUndefined(http.get<ArazzoRunDto>(`arazzo/runs/${enc(runId)}`));
      return dto && toRun(dto);
    },
    save: async (run) => {
      await http.put(`arazzo/runs/${enc(run.id)}`, run);
    },
  };

  /** The frames after `after`: the progress feed, or the run itself when the backend has no feed. */
  function progressOf(runId: string) {
    let feed = true;
    let last: string | undefined;
    return async (after: number | undefined, signal: AbortSignal): Promise<ArazzoRunFrameDto[]> => {
      if (feed) {
        try {
          return await http.get<ArazzoRunFrameDto[]>(`arazzo/runs/${enc(runId)}/progress`, { query: { after, limit: 1 }, signal });
        } catch (error) {
          if (!(error instanceof NotFoundError)) throw error;
          feed = false;
        }
      }
      const run = await http.get<ArazzoRunDto>(`arazzo/runs/${enc(runId)}`, { signal });
      const json = JSON.stringify(run);
      if (json === last) return [];
      last = json;
      return [{ seq: (after ?? -1) + 1, run }];
    };
  }

  const runner: WorkflowRunner = {
    async start(request) {
      const run = await http.post<Pick<WorkflowRun, 'id'>>(`${workflowPath(request.documentId, request.workflowId)}/runs`, toLaunch(request));
      return run.id;
    },
    watch: (runId) => (listener) =>
      pollingStream(progressOf(runId), {
        intervalMs: RUN_POLL_MS,
        immediate: true,
        seq: (frame) => frame.seq,
        isLast: (frame) => frame.run.status !== 'RUNNING',
        isFatal: (error) => error instanceof NotFoundError,
      })((frame) => listener(toRun(frame.run))),
  };

  const sessions: SessionRepository = {
    list: async (documentId, workflowId) =>
      (await http.get<ArazzoSessionDto[]>('arazzo/sessions', { query: { document: documentId, workflow: workflowId } })).map(toSession),
    get: async (sessionId) => {
      const dto = await orUndefined(http.get<ArazzoSessionDto>(`arazzo/sessions/${enc(sessionId)}`));
      return dto && toSession(dto);
    },
    open: async (input) => toSession(await http.post<ArazzoSessionDto>('arazzo/sessions', toSessionRequest(input))),
    async verify(sessionId) {
      await http.post(`arazzo/sessions/${enc(sessionId)}/verification`);
      const session = await sessions.get(sessionId);
      if (!session) throw new NotFoundError('Session', sessionId);
      return session;
    },
  };

  return { documents, runs, runner, sessions };
}
