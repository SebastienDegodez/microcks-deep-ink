// @vitest-environment node
/**
 * The HTTP adapters against answers shaped as the Arazzo POC sends them (SebastienDegodez/microcks, branch
 * `feature/arazzo`, SHA 2e6dde48: `ArazzoDocumentSummary`, `ArazzoWorkflowDetail`, `WorkflowResult`, `WorkflowRunSummary`,
 * serialised by Jackson, dates as epoch milliseconds), and the POC semantics of `PUT .../sources` (replace every link).
 */
import { http as mswHttp, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { runHeadline, verdictExplanation } from '@/domain/arazzo';
import { createHttpClient } from '@/infrastructure/http/client';
import { FixedClock } from '@/infrastructure/in-memory/shared';
import { createArazzoHandlers } from '@/infrastructure/msw/handlers/arazzo';
import { server } from '@/infrastructure/msw/node';
import type { ArazzoLinksRequestDto, PocWorkflowDetail, PocWorkflowResult, PocWorkflowRunSummary } from './dto';
import { createHttpArazzoAdapters } from '.';

const DOC_ID = '6728f1c2a4e1b93d5c0e7a14';
const STARTED = Date.parse('2026-11-03T09:10:04Z');

/** `List<ArazzoDocumentSummary>`: two linked sources (`ArazzoSourceSummary`), one workflow (`ArazzoWorkflowSummary`). */
const POC_DOCUMENTS = [
  {
    id: DOC_ID,
    title: 'Pastry workflows',
    version: '1.2.0',
    arazzoVersion: '1.0.1',
    fileName: 'pastry-workflows.arazzo.yaml',
    importDate: STARTED,
    sources: [
      { link: { sourceName: 'apiPastry', apiName: 'API Pastry', apiVersion: '2.0', linked: true }, apiId: 'pastry2', apiType: 'REST' },
      { link: { sourceName: 'pastryOrders', apiName: 'Pastry orders', apiVersion: '0.1.0', linked: true }, apiId: 'orders', apiType: 'EVENT' },
    ],
    workflows: [{ status: { workflowId: 'restock-pastry', runnable: true, reasons: [] }, description: 'Restock a pastry', stepCount: 2, lastResult: null, lastRun: null }],
  },
];

/** `ArazzoWorkflowDetail`: outputs and step outputs are `Map<String, String>`, the operation nested, runnability in `status`. */
const POC_WORKFLOW: PocWorkflowDetail & Record<string, unknown> = {
  documentId: DOC_ID,
  title: 'Pastry workflows',
  version: '1.2.0',
  arazzoVersion: '1.0.1',
  fileName: 'pastry-workflows.arazzo.yaml',
  importDate: STARTED,
  workflowIds: ['restock-pastry'],
  sources: [],
  workflowId: 'restock-pastry',
  summary: 'Restock a pastry',
  description: null,
  inputs: [{ name: 'size', usedBy: [{ stepId: 'listPastries', place: 'parameter', target: 'size' }], type: 'string', required: true } as never],
  steps: [
    {
      stepId: 'listPastries',
      description: 'List the pastries of a size',
      operation: { sourceName: 'apiPastry', operationId: 'GetPastries', method: 'GET', path: '/pastries', reason: null, channel: null } as never,
      parameters: [{ name: 'size', in: 'query', value: '$inputs.size' }],
      requestBody: null,
      successCriteria: [{ condition: '$statusCode == 200', context: null, type: null }],
      outputs: { pastryName: '$response.body#/0/name' },
      onSuccess: [],
      onFailure: [{ name: 'retryList', type: 'retry', retryAfter: 1, retryLimit: 2, criteria: null }],
      dependsOn: null,
    },
    {
      stepId: 'patchPastry',
      description: null,
      operation: { sourceName: 'apiPastry', operationId: 'PatchPastry', method: 'PATCH', path: '/pastries/{name}', reason: null, channel: null } as never,
      parameters: [{ name: 'name', in: 'path', value: '$steps.listPastries.outputs.pastryName' }],
      requestBody: { contentType: 'application/json', payload: '{"price": 3.9}' },
      successCriteria: [{ condition: '^2', context: '$statusCode', type: 'regex' }],
      outputs: {},
      onSuccess: [{ name: 'done', type: 'end', retryAfter: null, retryLimit: null, criteria: [] }],
      onFailure: [],
      dependsOn: ['listPastries'],
    },
  ],
  outputs: { pastryName: '$steps.listPastries.outputs.pastryName' },
  dataPassings: [],
  status: { workflowId: 'restock-pastry', runnable: false, reasons: ['Source apiPastry is not linked to an API of Microcks'] },
  examples: [],
};

/** `WorkflowResult` of a successful run on the mocks launched from the UI: no `options`, `origin` null, no steps recorded. */
const POC_RESULT: PocWorkflowResult & Record<string, unknown> = {
  id: '6729c0ffee0000000000aa01',
  documentId: DOC_ID,
  documentTitle: 'Pastry workflows',
  documentVersion: '1.2.0',
  workflowId: 'restock-pastry',
  target: 'MOCKS',
  sources: [],
  inputs: { size: 'M' },
  outputs: { pastryName: 'Eclair Cafe' },
  status: 'SUCCESS',
  startedDate: STARTED,
  elapsedTime: 120,
  timeout: null,
  secretRef: null,
  steps: [],
  message: null,
  number: 3,
  missingExample: null,
  validateSchema: false,
  example: null,
  origin: null,
  session: null,
};

/** A failed `WorkflowResult` on the implementations, played by a mock URL, with its step results. */
const POC_FAILED: PocWorkflowResult = {
  ...POC_RESULT,
  id: '6729c0ffee0000000000aa02',
  target: 'IMPLEMENTATIONS',
  sources: [{ sourceName: 'apiPastry', baseUrl: 'https://pastry.staging.acme.io/v2' }],
  status: 'FAILURE',
  outputs: {},
  number: 4,
  validateSchema: true,
  origin: 'MOCK_URL',
  example: { name: 'restock-eclair' },
  steps: [
    { index: 0, stepId: 'listPastries', operation: { sourceName: 'apiPastry', operationId: 'GetPastries', method: 'GET', path: '/pastries' }, status: 'PASSED', statusCode: 200, elapsedTime: 40, criteria: [{ condition: '$statusCode == 200', held: true }], outputs: { pastryName: 'Eclair Cafe' }, message: null, requestUrl: 'https://pastry.staging.acme.io/v2/pastries?size=M', parameters: [{ name: 'size', in: 'query', value: 'M', expression: '$inputs.size' }] },
    { index: 1, stepId: 'patchPastry', operation: { sourceName: 'apiPastry', operationId: 'PatchPastry', method: 'PATCH', path: '/pastries/{name}' }, status: 'FAILED', statusCode: 500, elapsedTime: 80, criteria: [{ condition: '$statusCode == 200', held: false }], outputs: {}, message: 'Success criteria not met', requestUrl: null, parameters: [] },
  ],
};

/** `List<WorkflowRunSummary>` of `GET /api/arazzo/documents/{documentId}/runs`: no document id. */
const POC_HISTORY: PocWorkflowRunSummary[] = [
  { id: POC_FAILED.id, number: 4, workflowId: 'restock-pastry', target: 'IMPLEMENTATIONS', status: 'FAILURE', failedStepId: 'patchPastry', startedDate: STARTED, elapsedTime: 120, example: 'restock-eclair', origin: 'MOCK_URL' },
  { id: POC_RESULT.id, number: 3, workflowId: 'restock-pastry', target: 'MOCKS', status: 'SUCCESS', failedStepId: null, startedDate: STARTED, elapsedTime: 120, example: null, origin: null },
];

const adapters = () => createHttpArazzoAdapters({ http: createHttpClient({ baseUrl: 'http://demo.test/api/' }), clock: new FixedClock(), microcksBase: 'http://microcks.local:8080/' });

describe('arazzo adapters over POC-shaped answers', () => {
  const puts: ArazzoLinksRequestDto[] = [];
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
  afterEach(() => {
    server.resetHandlers();
    puts.length = 0;
  });
  afterAll(() => server.close());

  const usePoc = () =>
    server.use(
      mswHttp.get('*/api/arazzo/documents', () => HttpResponse.json(POC_DOCUMENTS)),
      mswHttp.get('*/api/arazzo/documents/:documentId/workflows/:workflowId', () => HttpResponse.json(POC_WORKFLOW)),
      mswHttp.get('*/api/arazzo/documents/:documentId/runs', () => HttpResponse.json(POC_HISTORY)),
      mswHttp.get('*/api/arazzo/runs/:runId', ({ params }) => HttpResponse.json([POC_RESULT, POC_FAILED].find((r) => r.id === params['runId']))),
      mswHttp.put('*/api/arazzo/documents/:documentId/sources', async ({ request }) => {
        puts.push((await request.json()) as ArazzoLinksRequestDto);
        return HttpResponse.json(POC_DOCUMENTS[0]);
      }),
    );

  it('reads a document summary: sources from their link, workflow ids from their status', async () => {
    usePoc();
    const doc = (await adapters().documents.document(DOC_ID))!;
    expect(doc.file).toBe('pastry-workflows.arazzo.yaml');
    expect(doc.workflowIds).toEqual(['restock-pastry']);
    expect(doc.sources.map((s) => [s.name, s.type, s.link])).toEqual([
      ['apiPastry', 'openapi', { status: 'linked', serviceId: 'pastry2', protocol: 'REST', operationsFound: '' }],
      ['pastryOrders', 'asyncapi', { status: 'linked', serviceId: 'orders', protocol: 'EVENT', operationsFound: '' }],
    ]);
  });

  it('reads a workflow detail whose outputs are maps: lists of named expressions, steps from their operation', async () => {
    usePoc();
    const workflow = (await adapters().documents.workflow(DOC_ID, 'restock-pastry'))!;
    expect(workflow.outputs).toEqual([{ name: 'pastryName', expression: '$steps.listPastries.outputs.pastryName' }]);
    expect(workflow.steps.map((s) => s.outputs)).toEqual([[{ name: 'pastryName', expression: '$response.body#/0/name' }], []]);
    expect(workflow.steps[0]).toMatchObject({ sourceName: 'apiPastry', operationId: 'GetPastries', method: 'GET', path: '/pastries', parameters: [{ name: 'size', in: 'query', value: '$inputs.size' }] });
    expect(workflow.steps[0]?.onFailure).toEqual([{ type: 'retry', name: 'retryList', retryAfter: 1, retryLimit: 2 }]);
    expect(workflow.steps[1]).toMatchObject({ requestBody: '{"price": 3.9}', successCriteria: [{ type: 'regex', context: '$statusCode', condition: '^2' }], onSuccess: [{ type: 'end', name: 'done', criteria: [] }], dependsOn: ['listPastries'] });
    expect(workflow.inputs).toEqual([{ name: 'size', type: 'string' }]);
    expect(workflow.mockUrl).toBe('http://microcks.local:8080/arazzo/Pastry%20workflows/1.2.0/restock-pastry');
    expect(workflow.runnability).toEqual({ runnable: false, reason: 'source-not-linked', message: 'Source apiPastry is not linked to an API of Microcks' });
    // What the Loom and the workflow page do with them.
    expect(() => workflow.outputs.map((o) => o.name)).not.toThrow();
  });

  it('reads a WorkflowResult without options nor origin: defaults from its top-level fields, readable by the run page', async () => {
    usePoc();
    const run = (await adapters().runs.get(POC_RESULT.id))!;
    expect(run).toMatchObject({
      number: 3,
      documentId: DOC_ID,
      origin: { kind: 'api' },
      target: { kind: 'mocks' },
      options: { inputs: { size: 'M' }, timeoutMs: 10_000, validateSchemas: false },
      status: 'SUCCESS',
      startedAt: '2026-11-03T09:10:04.000Z',
      steps: [],
      outputs: { pastryName: 'Eclair Cafe' },
      coherence: [],
    });
    expect(verdictExplanation(run)).toBe('Every step passed its success criteria.');
    expect(runHeadline(run).title).toBe('Run #3 passed');
  });

  it('reads a failed WorkflowResult: implementations target, mock-url origin, example, step results', async () => {
    usePoc();
    const run = (await adapters().runs.get(POC_FAILED.id))!;
    expect(run).toMatchObject({
      origin: { kind: 'mock-url' },
      target: { kind: 'implementations', baseUrls: { apiPastry: 'https://pastry.staging.acme.io/v2' } },
      options: { example: 'restock-eclair', validateSchemas: true },
      status: 'FAILURE',
    });
    expect(run.steps.map((s) => [s.stepId, s.status, s.attempts.map((a) => a.httpStatus)])).toEqual([
      ['listPastries', 'passed', [200]],
      ['patchPastry', 'failed', [500]],
    ]);
    expect(run.steps[0]?.request).toEqual({ method: 'GET', url: 'https://pastry.staging.acme.io/v2/pastries?size=M', params: { size: 'M' } });
    expect(verdictExplanation(run)).toContain('Step 2, patchPastry, failed');
  });

  it('keeps the run history of a document: summaries get the document id of the path', async () => {
    usePoc();
    const { runs } = adapters();
    const listed = await runs.list({ documentId: DOC_ID });
    expect(listed.map((r) => [r.number, r.documentId, r.status, r.origin.kind])).toEqual([
      [4, DOC_ID, 'FAILURE', 'mock-url'],
      [3, DOC_ID, 'SUCCESS', 'api'],
    ]);
    expect((await runs.list({ documentId: DOC_ID, workflowId: 'restock-pastry', origin: 'mock-url' })).map((r) => r.number)).toEqual([4]);
    expect((await runs.list()).map((r) => r.number)).toEqual([4, 3]);
  });

  it('relinks one source without dropping the other links (the POC PUT replaces them all)', async () => {
    usePoc();
    await adapters().documents.linkSource(DOC_ID, 'apiPastry', 'pastry3');
    expect(puts).toEqual([{ links: { apiPastry: { serviceId: 'pastry3' }, pastryOrders: { serviceId: 'orders' } } }]);
  });
});

describe('arazzo MSW handlers: PUT .../sources replaces the links, as the POC does', () => {
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('unlinks the sources left out of the body, and their workflows stop being runnable', async () => {
    server.use(...createArazzoHandlers());
    const put = await fetch('http://demo.test/api/arazzo/documents/pastry/sources', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ links: { apiPastry: { serviceId: 'pastry2' } } }),
    });
    const doc = (await put.json()) as { sources: { name: string; link: { status: string } }[] };
    expect(doc.sources.map((s) => [s.name, s.link.status])).toEqual([
      ['apiPastry', 'linked'],
      ['apiPastryV1', 'not-linked'],
      ['pastryOrders', 'not-linked'],
    ]);
    const { documents } = adapters();
    expect((await documents.workflow('pastry', 'restock-pastry'))?.runnability.runnable).toBe(true);
    expect((await documents.workflow('pastry', 'order-pastry'))?.runnability).toMatchObject({ runnable: false, reason: 'source-not-linked' });
  });

  it('linkSource through the adapter keeps every other link of the document', async () => {
    server.use(...createArazzoHandlers());
    const doc = await adapters().documents.linkSource('pastry', 'apiPastryV1', 'pastry1');
    expect(doc.sources.map((s) => s.link.status)).toEqual(['linked', 'linked', 'linked']);
  });
});
