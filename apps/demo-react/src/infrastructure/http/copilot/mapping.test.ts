// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { FixedClock } from '@/infrastructure/in-memory/shared';
import { createInMemoryCopilotAdapters } from '@/infrastructure/in-memory/copilot';
import { NotFoundError } from '@/application/shared';
import type { HttpClient, RequestOptions } from '@/infrastructure/http/client';
import type { MicrocksSuggestedExchange } from './dto';
import { dispatchCriteriaOf, toCopilotExchange } from '@/infrastructure/http/catalog/mapping';
import { fromSuggestedExchanges, toSuggestedExchange } from './mapping';
import { createHttpCopilotAdapters } from '.';

/** What Microcks' `GET /api/copilot/samples/{id}?operation=GET /pastries/{name}` answers: no ids, nulls, two exchanges. */
const MICROCKS_SAMPLES = [
  {
    type: 'reqRespPair',
    request: {
      id: null, name: 'Tarte Tatin', operationId: null, content: null, headers: null, responseId: null,
      queryParameters: [{ name: 'name', value: 'Tarte Tatin' }],
    },
    response: {
      id: null, name: 'Tarte Tatin', operationId: null, headers: [{ name: 'content-type', values: ['application/json'] }],
      content: '{"name":"Tarte Tatin","price":3.2}', mediaType: 'application/json', status: '200', dispatchCriteria: '/name=Tarte Tatin',
    },
  },
  {
    type: 'reqRespPair',
    request: { name: 'Unknown pastry', queryParameters: [{ name: 'name', value: 'Croissant' }] },
    response: { name: 'Unknown pastry', content: '', mediaType: null, status: '404', dispatchCriteria: '/name=Croissant' },
  },
] as unknown as MicrocksSuggestedExchange[];

describe('suggested exchanges', () => {
  it('reads Microcks Copilot exchanges (no id, null fields) as pending AI examples', () => {
    expect(fromSuggestedExchanges(MICROCKS_SAMPLES, 'GET /pastries/{name}')).toEqual([
      {
        id: 'ai-get-pastries-name-tarte-tatin', name: 'Tarte Tatin',
        request: { params: { name: 'Tarte Tatin' } },
        response: { status: 200, body: '{"name":"Tarte Tatin","price":3.2}' },
        aiGenerated: true, reviewState: 'pending',
      },
      {
        id: 'ai-get-pastries-name-unknown-pastry', name: 'Unknown pastry',
        request: { params: { name: 'Croissant' } },
        response: { status: 404, body: '' },
        aiGenerated: true, reviewState: 'pending',
      },
    ]);
  });

  it('reads a request body, an event message, skips request/reply events and keeps ids unique', () => {
    const exchanges = [
      { type: 'reqRespPair', request: { name: 'Sold out', content: '{"status":"unknown"}', queryParameters: [] }, response: { name: 'Sold out', content: '{}', status: '200' } },
      { type: 'reqRespPair', request: { name: 'Sold out' }, response: { name: 'Sold out', content: '{}' } },
      { type: 'unidirEvent', eventMessage: { name: 'Order created', content: '{"id":1}', mediaType: 'application/json' } },
      { type: 'reqReplyEvent' },
    ] as unknown as MicrocksSuggestedExchange[];
    const examples = fromSuggestedExchanges(exchanges, 'patch-name');
    expect(examples.map((e) => e.id)).toEqual(['ai-patch-name-sold-out', 'ai-patch-name-sold-out-2', 'ai-patch-name-order-created']);
    expect(examples[0]?.request).toEqual({ params: {}, body: '{"status":"unknown"}' });
    expect(examples[1]?.response.status).toBe(200);
    expect(examples[2]).toMatchObject({ request: { params: {} }, response: { status: 200, body: '{"id":1}' } });
  });

  it('round-trips the in-memory proposals through the mock exchanges, ids included', async () => {
    const { copilot } = createInMemoryCopilotAdapters({ clock: new FixedClock() });
    const proposals = await copilot.suggestExamples('pastry2', 'patch-name', { count: 3 });
    const exchanges = JSON.parse(JSON.stringify(proposals.map((p) => toSuggestedExchange(p, 'PATCH /pastries/{name}', { event: false, dispatcher: 'URI_PARTS', dispatcherRules: 'name' })))) as MicrocksSuggestedExchange[];
    expect(fromSuggestedExchanges(exchanges, 'patch-name')).toEqual(proposals);
  });
});

/** A fake client recording the calls; answers by path. */
function fakeHttp(answers: Record<string, unknown>): { http: HttpClient; calls: { path: string; options?: RequestOptions }[] } {
  const calls: { path: string; options?: RequestOptions }[] = [];
  const get = async (path: string, options?: RequestOptions) => {
    calls.push({ path, options });
    if (!(path in answers)) throw new NotFoundError('Route', path);
    return answers[path];
  };
  const http = { get, post: get, put: get, patch: get, delete: get } as unknown as HttpClient;
  return { http, calls };
}

describe('createHttpCopilotAdapters', () => {
  it('against a plain Microcks: the operation id is the operation name, at most `count` proposals', async () => {
    const { http, calls } = fakeHttp({ 'copilot/samples/abc123': MICROCKS_SAMPLES });
    const { copilot } = createHttpCopilotAdapters({ http, clock: new FixedClock() });
    const proposals = await copilot.suggestExamples('abc123', 'GET /pastries/{name}', { count: 1, hint: '  Tarte Tatin ' });
    expect(proposals.map((p) => p.name)).toEqual(['Tarte Tatin']);
    expect(calls.at(-1)).toEqual({ path: 'copilot/samples/abc123', options: { query: { operation: 'GET /pastries/{name}', count: 1, hint: 'Tarte Tatin' } } });
  });

  it('names the operation from the demo extras when the backend has them', async () => {
    const { http, calls } = fakeHttp({
      'demo/services/pastry2': { operations: { 'GET /pastries/{name}': { id: 'get-name' } } },
      'copilot/samples/pastry2': [],
    });
    const { copilot } = createHttpCopilotAdapters({ http, clock: new FixedClock() });
    expect(await copilot.suggestExamples('pastry2', 'get-name', { count: 2 })).toEqual([]);
    expect(calls.at(-1)?.options?.query).toEqual({ operation: 'GET /pastries/{name}', count: 2, hint: undefined });
  });

  it('has no workflow context without a hint (no request) nor when the backend lacks the route', async () => {
    const { http, calls } = fakeHttp({});
    const { copilot } = createHttpCopilotAdapters({ http, clock: new FixedClock() });
    expect(await copilot.workflowContext('pastry2', '  ')).toBeUndefined();
    expect(calls).toHaveLength(0);
    expect(await copilot.workflowContext('pastry2', 'Tarte Tatin')).toBeUndefined();
    expect(calls.map((c) => c.path)).toEqual(['copilot/workflow-context/pastry2']);
  });
});

describe('dispatchCriteriaOf (Microcks DispatchCriteriaHelper)', () => {
  it('builds the criteria of the URI dispatchers, params sorted by name and filtered by the rule', () => {
    expect(dispatchCriteriaOf({ dispatcher: 'URI_PARTS', dispatcherRules: 'name' }, { name: 'Tarte Tatin' })).toBe('/name=Tarte Tatin');
    expect(dispatchCriteriaOf({ dispatcher: 'URI_PARTS', dispatcherRules: 'year && month' }, { year: '2026', month: '11', other: 'x' })).toBe('/month=11/year=2026');
    expect(dispatchCriteriaOf({ dispatcher: 'URI_PARAMS', dispatcherRules: 'size' }, { size: 'S' })).toBe('?size=S');
    expect(dispatchCriteriaOf({ dispatcher: 'URI_ELEMENTS', dispatcherRules: 'id ?? format' }, { format: 'json', id: '42' })).toBe('/id=42?format=json');
    expect(dispatchCriteriaOf({ dispatcher: 'URI_PARAMS', dispatcherRules: 'page' }, { 'page-size': '10' })).toBe('');
  });

  it('uses the root dispatcher of a FALLBACK and nothing for the body/script dispatchers', () => {
    const fallback = JSON.stringify({ dispatcher: 'URI_PARTS', dispatcherRules: 'name', fallback: 'Millefeuille' });
    expect(dispatchCriteriaOf({ dispatcher: 'FALLBACK', dispatcherRules: fallback }, { name: 'Eclair' })).toBe('/name=Eclair');
    expect(dispatchCriteriaOf({ dispatcher: 'JSON_BODY', dispatcherRules: '/orderId' }, { '/orderId': '1' })).toBeUndefined();
    expect(dispatchCriteriaOf({}, { name: 'x' })).toBeUndefined();
  });

  it('serialises a proposal as Microcks would accept it: criteria on a pair, eventMessage for an event API', () => {
    const example = { id: 'ai-1', name: 'Tarte Tatin', request: { params: { name: 'Tarte Tatin' } }, response: { status: 200, body: '{}' } };
    expect(toCopilotExchange(example, 'GET /pastries/{name}', { event: false, dispatcher: 'URI_PARTS', dispatcherRules: 'name' })).toMatchObject({
      type: 'reqRespPair', response: { dispatchCriteria: '/name=Tarte Tatin', status: '200' },
    });
    expect(toCopilotExchange({ ...example, request: { params: { '/orderId': '1' } } }, 'PUBLISH orders', { event: true })).toEqual({
      type: 'unidirEvent', eventMessage: { id: 'ai-1', name: 'Tarte Tatin', operationId: 'PUBLISH orders', mediaType: 'application/json', content: '{}' },
    });
  });
});
