import { describe, expect, it } from 'vitest';
import type { StartRunRequest } from '@/application/ports/arazzo';
import { createInMemoryArazzoAdapters } from '@/infrastructure/in-memory/arazzo';
import {
  fromLaunch,
  fromSessionRequest,
  matchesRunFilter,
  toDocument,
  toImportIssues,
  toLaunch,
  toLinksRequest,
  toRun,
  toRunsQuery,
  toSession,
  toSessionRequest,
  toWorkflow,
  workflowMockUrl,
} from './mapping';

const MICROCKS = 'http://microcks.local:8080';
const request = (over: Partial<StartRunRequest> = {}): StartRunRequest => ({
  documentId: 'pastry',
  workflowId: 'restock-pastry',
  target: { kind: 'mocks' },
  origin: { kind: 'ui' },
  options: { example: 'restock-eclair', inputs: { size: 'M', newPrice: 3.9 }, timeoutMs: 10_000, validateSchemas: false },
  ...over,
});

describe('answers -> domain', () => {
  it('keeps the demo payloads as they are', async () => {
    const { documents, runs, sessions } = createInMemoryArazzoAdapters();
    const doc = (await documents.document('pastry'))!;
    const workflow = (await documents.workflow('pastry', 'restock-pastry'))!;
    const run = (await runs.list())[0]!;
    const session = (await sessions.list('pastry', 'restock-pastry'))[0]!;
    const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
    expect(toDocument(json(doc))).toEqual(json(doc));
    expect(toWorkflow(json(workflow), doc, 'http://elsewhere')).toEqual(json(workflow));
    expect(toRun(json(run))).toEqual(json(run));
    expect(toSession(json(session))).toEqual(json(session));
  });

  it('reads a POC document summary (fileName, workflows) without the demo fields', () => {
    expect(
      toDocument({ id: '6731', title: 'Pastry workflows', version: '1.2.0', arazzoVersion: '1.0.1', fileName: 'pastry.arazzo.yaml', workflows: [{ workflowId: 'restock-pastry' }] }),
    ).toEqual({
      id: '6731',
      apiId: '6731',
      title: 'Pastry workflows',
      version: '1.2.0',
      arazzoVersion: '1.0.1',
      file: 'pastry.arazzo.yaml',
      origin: '',
      sources: [],
      workflowIds: ['restock-pastry'],
      importIssues: [],
    });
  });

  it('builds the POC mock URL of a workflow the answer has none for', () => {
    expect(workflowMockUrl(`${MICROCKS}/`, { title: 'Pastry workflows', version: '1.2.0' }, 'restock-pastry')).toBe(
      `${MICROCKS}/arazzo/Pastry%20workflows/1.2.0/restock-pastry`,
    );
    const workflow = toWorkflow({ workflowId: 'restock-pastry', documentId: 'pastry', summary: 'Restock a pastry' }, { title: 'Pastry workflows', version: '1.2.0' }, MICROCKS);
    expect(workflow).toMatchObject({ mockUrl: `${MICROCKS}/arazzo/Pastry%20workflows/1.2.0/restock-pastry`, inputs: [], steps: [], outputs: [], runnability: { runnable: true } });
  });

  it('defaults the lists of a run and of a session', () => {
    const run = toRun({ id: 'r', number: 1, documentId: 'pastry', workflowId: 'w', origin: { kind: 'api' }, target: { kind: 'mocks' }, options: { inputs: {}, timeoutMs: 1, validateSchemas: false }, status: 'RUNNING', startedAt: 'x' });
    expect(run).toMatchObject({ steps: [], outputs: {}, coherence: [] });
    expect(toSession({ id: 's', app: 'a', documentId: 'd', workflowId: 'w', state: 'open', openedAt: 'x', inputs: {} }).calls).toEqual([]);
  });

  it('reads the import issues of an analysis, none for a POC answer or a 404', () => {
    const issue = { code: 'goto', path: 'workflows[0]', message: 'goto' } as const;
    expect(toImportIssues({ refusal: null, importIssues: [issue] })).toEqual([issue]);
    expect(toImportIssues({ refusal: 'Unsupported' })).toEqual([]);
    expect(toImportIssues(undefined)).toEqual([]);
  });
});

describe('requests (POC bodies)', () => {
  it('launches a run on the mocks as an ArazzoRunLaunchDTO, and back', () => {
    const launch = toLaunch(request());
    expect(launch).toEqual({ inputs: { size: 'M', newPrice: 3.9 }, timeout: 10_000, implementations: undefined, secretName: undefined, validateSchema: false, example: 'restock-eclair', origin: { kind: 'ui' }, target: undefined });
    const { documentId: _d, workflowId: _w, ...rest } = request();
    expect(fromLaunch(JSON.parse(JSON.stringify(launch)))).toEqual(rest);
  });

  it('launches on the implementations with their base URLs and the secret', () => {
    const target = { kind: 'implementations', baseUrls: { apiPastry: 'https://pastry.staging.acme.io/v2' } } as const;
    const launch = toLaunch(request({ target, options: { inputs: {}, secret: 'staging', timeoutMs: 5000, validateSchemas: true } }));
    expect(launch).toMatchObject({ implementations: target.baseUrls, secretName: 'staging', validateSchema: true });
    expect(fromLaunch(launch)).toMatchObject({ target, options: { secret: 'staging', timeoutMs: 5000, validateSchemas: true } });
  });

  it('reads a bare POC launch: the mocks, the API origin, the default timeout, no schema validation', () => {
    expect(fromLaunch({ inputs: { size: 'S' } })).toEqual({ target: { kind: 'mocks' }, origin: { kind: 'api' }, options: { inputs: { size: 'S' }, timeoutMs: 10_000, validateSchemas: false } });
  });

  it('keeps the proposed mixed target as a demo extension', () => {
    const target = { kind: 'mixed', perSource: { apiPastry: 'mock' }, proposed: true } as const;
    expect(fromLaunch(toLaunch(request({ target }))).target).toEqual(target);
  });

  it('opens a session with the failure injection as POC failures, and back', () => {
    const input = { documentId: 'pastry', workflowId: 'restock-pastry', app: 'checkout-web', inputs: { size: 'M' }, failureInjection: { stepId: 'patchPastry', example: 'out-of-stock' } };
    const dto = toSessionRequest(input);
    expect(dto.failures).toEqual({ patchPastry: 'out-of-stock' });
    expect(fromSessionRequest(dto)).toEqual(input);
    expect(fromSessionRequest({ documentId: 'd', workflowId: 'w', inputs: {} })).toEqual({ documentId: 'd', workflowId: 'w', app: 'api', inputs: {} });
  });

  it('links a source with a ServiceRef and filters runs by workflow (POC) and origin (demo)', () => {
    expect(toLinksRequest('beerCatalog', 'beer')).toEqual({ links: { beerCatalog: { serviceId: 'beer' } } });
    expect(toRunsQuery({ documentId: 'pastry', workflowId: 'w', origin: 'mock-url' })).toEqual({ workflow: 'w', origin: 'mock-url' });
  });

  it('filters runs again on the client', async () => {
    const run = (await createInMemoryArazzoAdapters().runs.list())[0]!;
    expect(matchesRunFilter(run, {})).toBe(true);
    expect(matchesRunFilter(run, { documentId: 'pastry', workflowId: 'restock-pastry', origin: run.origin.kind })).toBe(true);
    expect(matchesRunFilter(run, { origin: 'session' })).toBe(false);
  });
});
