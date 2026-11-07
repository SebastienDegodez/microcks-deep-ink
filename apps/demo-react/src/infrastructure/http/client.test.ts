// @vitest-environment node
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { BackendError, NotFoundError, ValidationError } from '@/application/shared';
import { API } from '@/infrastructure/msw/handlers';
import { server } from '@/infrastructure/msw/node';
import { createHttpClient, defaultApiBaseUrl } from './client';

const client = createHttpClient({ baseUrl: 'http://demo.test/microcks-deep-ink/demo/api' });

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('HttpClient', () => {
  it('resolves paths under the base URL, sends the query and parses JSON', async () => {
    let seen = '';
    server.use(
      http.get(`${API}/services`, ({ request }) => {
        seen = request.url;
        return HttpResponse.json([{ id: 'pastry2' }]);
      }),
    );
    await expect(client.get('/services', { query: { q: 'pastry', label: ['a', 'b'], skip: undefined } })).resolves.toEqual([{ id: 'pastry2' }]);
    expect(seen).toBe('http://demo.test/microcks-deep-ink/demo/api/services?q=pastry&label=a&label=b');
  });

  it('sends a JSON body and accepts an empty answer', async () => {
    let received: unknown;
    server.use(
      http.post(`${API}/examples`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ ok: true }, { status: 201 });
      }),
      http.delete(`${API}/examples/1`, () => new HttpResponse(null, { status: 204 })),
    );
    await expect(client.post('examples', { name: 'Tarte Tatin' })).resolves.toEqual({ ok: true });
    expect(received).toEqual({ name: 'Tarte Tatin' });
    await expect(client.delete('examples/1')).resolves.toBeUndefined();
  });

  it('sends FormData and URLSearchParams as is and resolves a text/plain answer to its text', async () => {
    let multipart: string | null = null;
    let form = '';
    server.use(
      http.post(`${API}/artifact/upload`, async ({ request }) => {
        multipart = request.headers.get('content-type');
        const file = (await request.formData()).get('file');
        return HttpResponse.text(file instanceof File ? file.name : 'none', { status: 201 });
      }),
      http.post(`${API}/artifact/download`, async ({ request }) => {
        form = await request.text();
        return HttpResponse.text('API Pastry:2.0', { status: 201 });
      }),
    );
    const data = new FormData();
    data.append('file', new File(['openapi: 3.1.0'], 'apipastry-openapi.yaml'));
    await expect(client.post('artifact/upload', data)).resolves.toBe('apipastry-openapi.yaml');
    expect(multipart).toMatch(/^multipart\/form-data; boundary=/);
    await expect(client.post('artifact/download', new URLSearchParams({ url: 'https://acme.io/a.yaml', mainArtifact: 'true' }))).resolves.toBe('API Pastry:2.0');
    expect(form).toBe('url=https%3A%2F%2Facme.io%2Fa.yaml&mainArtifact=true');
  });

  it('maps 404 to NotFoundError, with the entity and id of the body when present', async () => {
    server.use(
      http.get(`${API}/services/nope`, () => HttpResponse.json({ entity: 'Service', id: 'nope' }, { status: 404 })),
      http.get(`${API}/plain`, () => new HttpResponse('gone', { status: 404 })),
    );
    const error = await client.get('services/nope').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toMatchObject({ entity: 'Service', id: 'nope' });
    await expect(client.get('plain')).rejects.toMatchObject({ name: 'NotFoundError', entity: 'Resource', id: 'plain' });
  });

  it('maps 400/422 to ValidationError and other statuses to BackendError(status)', async () => {
    server.use(
      http.post(`${API}/runs`, () => HttpResponse.json({ message: 'endpoint is required' }, { status: 422 })),
      http.get(`${API}/boom`, () => new HttpResponse(null, { status: 503 })),
    );
    await expect(client.post('runs', {})).rejects.toEqual(new ValidationError('endpoint is required'));
    const error = await client.get('boom').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BackendError);
    expect(error).toMatchObject({ status: 503, message: 'GET boom: 503' });
  });

  it('maps a network failure to BackendError with a null status', async () => {
    server.use(http.get(`${API}/down`, () => HttpResponse.error()));
    const error = await client.get('down').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BackendError);
    expect(error).toMatchObject({ status: null, message: 'GET down: network error' });
  });

  it('rethrows an abort as is', async () => {
    server.use(http.get(`${API}/slow`, () => new Promise<never>(() => {})));
    const controller = new AbortController();
    const pending = client.get('slow', { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('defaults the base URL to the api/ folder next to the page', () => {
    expect(defaultApiBaseUrl()).toBe('http://localhost/api/');
  });
});
