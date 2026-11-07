/**
 * Mock of the Arazzo API (see `src/infrastructure/http/arazzo/index.ts` for the endpoints): proposition v2 / not in
 * Microcks API, every route below. Paths and request bodies follow the POC of the maintainer's fork
 * (https://github.com/SebastienDegodez/microcks/tree/feature/arazzo); the demo-only ones are marked.
 *
 * The handlers delegate to the in-memory arazzo adapters (their seeds and their state: a run started, saved or created
 * by a session verification is listed and read afterwards; a linked source unblocks its workflows, and
 * `PUT .../sources` replaces the links as the POC does: a source left out is unlinked).
 * `GET /api/arazzo/runs/{runId}/progress` serves the frames of a run (`runFrames`, one per attempt then the final run)
 * after `after`, so the run page polls the same frames the in-memory runner streams.
 */
import { http, HttpResponse, type AnyHandler } from 'msw';
import { DEFAULT_RUN_TIMEOUT_MS, runFrames, type ArazzoDocument, type Workflow, type WorkflowRun } from '@/domain/arazzo';
import type { Clock } from '@/application/ports/shared';
import { NotFoundError } from '@/application/shared';
import type { ArazzoImportAnalysisDto, ArazzoLinksRequestDto, ArazzoRunFrameDto, ArazzoRunLaunchDto, ArazzoSessionRequestDto } from '@/infrastructure/http/arazzo/dto';
import { fromLaunch, fromSessionRequest } from '@/infrastructure/http/arazzo/mapping';
import { createInMemoryArazzoAdapters } from '@/infrastructure/in-memory/arazzo';
import { FixedClock } from '@/infrastructure/in-memory/shared';
import { API } from './api';

const MAX_PAGE = 50;
/** Header of the POC mock URL answer: the run that played the workflow. */
const RUN_ID_HEADER = 'X-Microcks-Arazzo-Run-Id';

export function createArazzoHandlers(deps: { clock?: Clock } = {}): AnyHandler[] {
  const clock = deps.clock ?? new FixedClock();
  const { documents, runs, runner, sessions } = createInMemoryArazzoAdapters({ clock });

  const notFound = (entity: string, id: string) => HttpResponse.json({ message: `${entity} ${id} not found`, entity, id }, { status: 404 });
  /** A `NotFoundError` of the in-memory adapters becomes a 404. */
  const guard = async (answer: () => Promise<Response>) => {
    try {
      return await answer();
    } catch (error) {
      if (error instanceof NotFoundError) return notFound(error.entity, error.id);
      throw error;
    }
  };
  const param = (params: Record<string, unknown>, key: string) => String(params[key]);
  const intParam = (url: URL, name: string, fallback: number, max = Number.MAX_SAFE_INTEGER) => {
    const value = Number(url.searchParams.get(name));
    return url.searchParams.has(name) && Number.isInteger(value) && value >= 0 ? Math.min(value, max) : fallback;
  };
  const created = <T extends Record<string, unknown>>(body: T, location: string) => HttpResponse.json(body, { status: 201, headers: { location } });
  const knownDocument = async (id: string) => (await documents.document(id)) !== undefined;

  /**
   * `PUT .../sources` REPLACES the links, as the POC does (`ArazzoImportService.relinkSources`): a source left out is
   * unlinked. The in-memory port only links, so the sources unlinked this way are kept here and applied when serving.
   */
  const unlinked = new Map<string, Set<string>>();
  const unlinkedOf = (documentId: string) => unlinked.get(documentId) ?? new Set<string>();
  const served = (doc: ArazzoDocument): ArazzoDocument => {
    const off = unlinkedOf(doc.id);
    if (off.size === 0) return doc;
    return {
      ...doc,
      sources: doc.sources.map((s) => (off.has(s.name) ? { ...s, link: { status: 'not-linked', expectedFile: s.url.replace(/^.*\//, '') } } : s)),
    };
  };
  const servedWorkflow = (workflow: Workflow): Workflow => {
    const off = workflow.steps.find((step) => unlinkedOf(workflow.documentId).has(step.sourceName))?.sourceName;
    return off
      ? { ...workflow, runnability: { runnable: false, reason: 'source-not-linked', message: `Workflow ${workflow.workflowId} cannot run until ${off} is linked` } }
      : workflow;
  };

  return [
    // --- Aligned with the POC --------------------------------------------------------------------------------------
    http.get(`${API}/arazzo/documents`, async () => HttpResponse.json((await documents.documents()).map(served))),
    http.get(`${API}/arazzo/documents/:documentId/workflows/:workflowId`, async ({ params }) => {
      const workflow = await documents.workflow(param(params, 'documentId'), param(params, 'workflowId'));
      return workflow ? HttpResponse.json(servedWorkflow(workflow)) : notFound('Workflow', param(params, 'workflowId'));
    }),
    http.put(`${API}/arazzo/documents/:documentId/sources`, ({ params, request }) =>
      guard(async () => {
        const id = param(params, 'documentId');
        const before = await documents.document(id);
        if (!before) return notFound('Arazzo document', id);
        const { links = {} } = (await request.json()) as Partial<ArazzoLinksRequestDto>;
        for (const name of Object.keys(links)) {
          if (!before.sources.some((s) => s.name === name)) return notFound('Source description', name);
        }
        for (const [name, ref] of Object.entries(links)) await documents.linkSource(id, name, ref.serviceId);
        unlinked.set(id, new Set(before.sources.map((s) => s.name).filter((name) => !(name in links))));
        return HttpResponse.json(served((await documents.document(id))!));
      }),
    ),
    http.post(`${API}/arazzo/documents/:documentId/analysis`, async ({ params }) => {
      const id = param(params, 'documentId');
      if (!(await knownDocument(id))) return notFound('Arazzo document', id);
      return HttpResponse.json<ArazzoImportAnalysisDto>({ refusal: null, importIssues: await documents.validate(id) });
    }),
    http.get(`${API}/arazzo/documents/:documentId/runs`, async ({ params, request }) => {
      const id = param(params, 'documentId');
      const url = new URL(request.url);
      const origin = (url.searchParams.get('origin') ?? undefined) as WorkflowRun['origin']['kind'] | undefined;
      return HttpResponse.json(await runs.list({ documentId: id, workflowId: url.searchParams.get('workflow') ?? undefined, origin }));
    }),
    http.post(`${API}/arazzo/documents/:documentId/workflows/:workflowId/runs`, ({ params, request }) =>
      guard(async () => {
        const launch = fromLaunch((await request.json()) as ArazzoRunLaunchDto);
        const runId = await runner.start({ documentId: param(params, 'documentId'), workflowId: param(params, 'workflowId'), ...launch });
        const run = await runs.get(runId);
        return created({ ...run }, `/api/arazzo/runs/${runId}`);
      }),
    ),
    http.get(`${API}/arazzo/runs/:runId`, async ({ params }) => {
      const run = await runs.get(param(params, 'runId'));
      return run ? HttpResponse.json(run) : notFound('Workflow run', param(params, 'runId'));
    }),
    http.post(`${API}/arazzo/sessions`, ({ request }) =>
      guard(async () => {
        const session = await sessions.open(fromSessionRequest((await request.json()) as ArazzoSessionRequestDto));
        return created({ ...session }, `/api/arazzo/sessions/${session.id}`);
      }),
    ),
    http.post(`${API}/arazzo/sessions/:sessionId/verification`, ({ params }) =>
      guard(async () => {
        const session = await sessions.verify(param(params, 'sessionId'));
        // The POC answers with the run the verification created.
        const run = (await runs.list({ documentId: session.documentId, workflowId: session.workflowId, origin: 'session' })).find(
          (r) => r.origin.kind === 'session' && r.origin.sessionId === session.id,
        );
        return run ? HttpResponse.json(run) : notFound('Workflow run', session.id);
      }),
    ),

    // --- Demo-only: proposition v2, beyond the POC ------------------------------------------------------------------
    http.get(`${API}/arazzo/documents/:documentId/source`, async ({ params }) => {
      const id = param(params, 'documentId');
      return (await knownDocument(id)) ? HttpResponse.text(await documents.source(id)) : notFound('Arazzo document', id);
    }),
    http.get(`${API}/arazzo/documents/:documentId/overlay`, async ({ params }) => {
      const overlay = await documents.overlay(param(params, 'documentId'));
      return overlay === undefined ? notFound('ArazzoSources overlay', param(params, 'documentId')) : HttpResponse.text(overlay);
    }),
    http.get(`${API}/arazzo/documents/:documentId/workflows/:workflowId/examples`, async ({ params }) =>
      HttpResponse.json(await documents.examples(param(params, 'documentId'), param(params, 'workflowId'))),
    ),
    http.put(`${API}/arazzo/runs/:runId`, async ({ params, request }) => {
      const run = (await request.json()) as WorkflowRun;
      await runs.save({ ...run, id: param(params, 'runId') });
      return new HttpResponse(null, { status: 204 });
    }),
    http.get(`${API}/arazzo/runs/:runId/progress`, async ({ params, request }) => {
      const run = await runs.get(param(params, 'runId'));
      if (!run) return notFound('Workflow run', param(params, 'runId'));
      const url = new URL(request.url);
      const from = url.searchParams.has('after') ? intParam(url, 'after', -1) + 1 : 0;
      const limit = intParam(url, 'limit', 1, MAX_PAGE);
      const frames = runFrames(run).slice(from, from + limit);
      return HttpResponse.json<ArazzoRunFrameDto[]>(frames.map((frame, i) => ({ seq: from + i, run: frame })));
    }),
    http.get(`${API}/arazzo/sessions`, async ({ request }) => {
      const url = new URL(request.url);
      return HttpResponse.json(await sessions.list(url.searchParams.get('document') ?? '', url.searchParams.get('workflow') ?? ''));
    }),
    http.get(`${API}/arazzo/sessions/:sessionId`, async ({ params }) => {
      const session = await sessions.get(param(params, 'sessionId'));
      return session ? HttpResponse.json(session) : notFound('Session', param(params, 'sessionId'));
    }),

    // --- POC mock URL (outside /api): plays a workflow on the mocks ---------------------------------------------------
    http.post('*/arazzo/:documentTitle/:documentVersion/:workflowId', async ({ params, request }) => {
      // The API routes above answer first; never shadow an unmatched one.
      if (new URL(request.url).pathname.includes('/api/')) return undefined;
      const title = param(params, 'documentTitle').replace(/\+/g, ' ');
      const document = (await documents.documents()).find((d) => d.title === title && d.version === param(params, 'documentVersion'));
      if (!document) return notFound('Arazzo document', `${title}:${param(params, 'documentVersion')}`);
      const text = await request.text();
      const inputs = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      return guard(async () => {
        const runId = await runner.start({
          documentId: document.id,
          workflowId: param(params, 'workflowId'),
          target: { kind: 'mocks' },
          origin: { kind: 'mock-url' },
          options: { inputs, timeoutMs: DEFAULT_RUN_TIMEOUT_MS, validateSchemas: false },
        });
        const run = (await runs.get(runId))!;
        const failed = run.steps.find((s) => s.status === 'failed');
        return run.status === 'SUCCESS'
          ? HttpResponse.json(run.outputs, { headers: { [RUN_ID_HEADER]: runId } })
          : HttpResponse.json({ runId, failedStep: failed?.stepId, reason: failed?.flow.text ?? 'The workflow failed' }, { status: 422, headers: { [RUN_ID_HEADER]: runId } });
      });
    }),
  ];
}
