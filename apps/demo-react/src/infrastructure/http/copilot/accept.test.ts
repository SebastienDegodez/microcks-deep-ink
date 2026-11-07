// @vitest-environment node
/**
 * Generation -> accept -> catalogue read over HTTP + MSW: an accepted Copilot proposal is stored with Microcks'
 * `POST /api/copilot/samples/{id}?operation=` (a JSON `Exchange[]`, 201 with no body), never with a demo-only write.
 */
import { http as mswHttp, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createCopilotUseCases } from '@/application/copilot';
import { createHttpClient } from '@/infrastructure/http/client';
import { createHttpCatalogAdapters } from '@/infrastructure/http/catalog';
import type { MicrocksExchange, MicrocksRequestResponsePair } from '@/infrastructure/http/catalog/dto';
import { fromExchange } from '@/infrastructure/http/catalog/mapping';
import { FixedClock } from '@/infrastructure/in-memory/shared';
import { createCatalogHandlers } from '@/infrastructure/msw/handlers/catalog';
import { createCopilotHandlers } from '@/infrastructure/msw/handlers/copilot';
import { server } from '@/infrastructure/msw/node';
import { createHttpCopilotAdapters } from '.';

interface Seen {
  method: string;
  path: string;
  operation: string | null;
  body?: unknown;
  status?: number;
  responseText?: string;
}

describe('accepting a Copilot proposal over http', () => {
  const seen: Seen[] = [];
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
  beforeEach(() => {
    seen.length = 0;
    server.use(...createCatalogHandlers(), ...createCopilotHandlers());
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  /** Records every call (method, path, `operation`, body, status and response text) on its way through MSW. */
  const recordingFetch: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const response = await fetch(input, init);
    seen.push({
      method: init?.method ?? 'GET',
      path: url.pathname.replace(/^\/api\//, ''),
      operation: url.searchParams.get('operation'),
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
      status: response.status,
      responseText: await response.clone().text(),
    });
    return response;
  };

  const useCases = () => {
    const http = createHttpClient({ baseUrl: 'http://demo.test/api/', fetch: recordingFetch });
    const clock = new FixedClock();
    const { catalog } = createHttpCatalogAdapters({ http, clock });
    const { copilot } = createHttpCopilotAdapters({ http, clock });
    return { copilot: createCopilotUseCases({ copilot, catalog }), catalog };
  };

  it('POSTs the Microcks exchanges to /copilot/samples/{id}?operation= and reads the example back as accepted AI', async () => {
    const { copilot, catalog } = useCases();
    const [proposal] = await copilot.generate({ serviceId: 'pastry2', operationId: 'get-name', count: 1, hint: 'Tarte Tatin' });
    expect(proposal).toMatchObject({ name: 'Tarte Tatin', reviewState: 'pending' });
    await copilot.accept('pastry2', 'get-name', proposal!);

    const writes = seen.filter((s) => s.method !== 'GET');
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ method: 'POST', path: 'copilot/samples/pastry2', operation: 'GET /pastries/{name}', status: 201, responseText: '' });
    const body = writes[0]!.body as MicrocksExchange[];
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      type: 'reqRespPair',
      request: { name: 'Tarte Tatin', queryParameters: [{ name: 'name', value: 'Tarte Tatin' }] },
      response: { name: 'Tarte Tatin', status: '200', mediaType: 'application/json' },
    });
    expect(seen.some((s) => s.method !== 'GET' && s.path.startsWith('demo/'))).toBe(false);

    const examples = await catalog.examples('pastry2', 'get-name');
    expect(examples.at(-1)).toMatchObject({ id: proposal!.id, name: 'Tarte Tatin', aiGenerated: true, reviewState: 'accepted' });
  });

  it('answers 403 with no body for an unknown operation, as Microcks', async () => {
    const response = await fetch('http://demo.test/api/copilot/samples/pastry2?operation=GET%20%2Fnope', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '[]',
    });
    expect(response.status).toBe(403);
  });

  it('a plain Microcks backend: the operation id is the operation name, no demo write', async () => {
    const posts: { url: string; body: unknown }[] = [];
    server.use(
      mswHttp.get('*/api/demo/services/:id', () => new HttpResponse(null, { status: 404 })),
      mswHttp.post('*/api/copilot/samples/:id', async ({ request }) => {
        posts.push({ url: request.url, body: await request.json() });
        return new HttpResponse(null, { status: 201 });
      }),
    );
    const { catalog } = useCases();
    const example = { id: 'x', name: 'Tarte Tatin', request: { params: { name: 'Tarte Tatin' } }, response: { status: 200, body: '{}' }, aiGenerated: true, reviewState: 'accepted' as const };
    await catalog.addExamples('64f1c0ffee', 'GET /pastries/{name}', [example]);
    expect(posts).toHaveLength(1);
    expect(new URL(posts[0]!.url).searchParams.get('operation')).toBe('GET /pastries/{name}');
    expect(seen.some((s) => s.method !== 'GET' && s.path.startsWith('demo/'))).toBe(false);
  });
});

describe('reading Microcks exchanges stored by the AI Copilot', () => {
  it('reads `sourceArtifact: AI Copilot` as an accepted AI example, without demo review flags', () => {
    const stored = {
      type: 'reqRespPair',
      request: { id: 'r1', name: 'Tarte Tatin', operationId: 'pastry2-GET /pastries/{name}', sourceArtifact: 'AI Copilot', responseId: 's1', queryParameters: [{ name: 'name', value: 'Tarte Tatin' }] },
      response: { id: 's1', name: 'Tarte Tatin', operationId: 'pastry2-GET /pastries/{name}', sourceArtifact: 'AI Copilot', status: '200', content: '{}', dispatchCriteria: '/name=Tarte Tatin' },
    } as MicrocksRequestResponsePair;
    expect(fromExchange(stored)).toMatchObject({ id: 's1', aiGenerated: true, reviewState: 'accepted' });
    expect(fromExchange(stored, { reviewState: 'pending' })).toMatchObject({ aiGenerated: true, reviewState: 'pending' });
    const plain = { ...stored, request: { ...stored.request, sourceArtifact: 'pastry.yaml' }, response: { ...stored.response, sourceArtifact: 'pastry.yaml' } } as MicrocksExchange;
    expect(fromExchange(plain)).not.toHaveProperty('aiGenerated');
  });
});
