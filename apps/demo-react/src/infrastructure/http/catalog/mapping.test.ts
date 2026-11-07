import { describe, expect, it } from 'vitest';
import type { Example } from '@/domain/shared';
import { createInMemoryCatalogAdapters } from '@/infrastructure/in-memory/catalog';
import type { MicrocksExchange, MicrocksService } from './dto';
import {
  epochToIso,
  fromExchange,
  fromLabelsMap,
  fromOperationDto,
  fromServiceDto,
  fromServiceType,
  operationName,
  toExchange,
  toLabelsMap,
  toOperationDto,
  toServiceDto,
  toServiceExtras,
  toServiceType,
} from './mapping';

const extras = { id: 'pastry2', format: 'OpenAPI 3.0.2', lastResults: null, testStatus: 'never', conformance: null, calls24h: 0, mcp: false, operations: {} } as const;

describe('Microcks DTO -> domain', () => {
  it('maps a Microcks Service (type, metadata labels, lastUpdate in epoch ms, operations)', () => {
    const dto: MicrocksService = {
      id: 'pastry2',
      name: 'API Pastry',
      version: '2.0',
      type: 'REST',
      sourceArtifact: 'apipastries-openapi.yaml',
      metadata: { createdOn: 0, lastUpdate: Date.UTC(2026, 10, 3, 7, 10, 4), labels: { domain: 'pastry', status: 'GA' } },
      operations: [{ name: 'GET /pastries', method: 'GET' }, { name: 'GET /pastries/{name}', method: 'GET' }],
    };
    expect(fromServiceDto(dto, { ...extras, exampleCount: 7 })).toMatchObject({
      id: 'pastry2',
      protocol: 'REST',
      operationCount: 2,
      exampleCount: 7,
      updatedAt: '2026-11-03T07:10:04Z',
      labels: [{ key: 'domain', value: 'pastry' }, { key: 'status', value: 'GA' }],
    });
  });

  it('maps every Microcks service type to a protocol, GENERIC_REST to DIRECT and GENERIC_EVENT to EVENT', () => {
    expect(['REST', 'SOAP_HTTP', 'GENERIC_REST', 'GENERIC_EVENT', 'EVENT', 'GRPC', 'GRAPHQL', 'A2A'].map((t) => fromServiceType(t as never))).toEqual(
      ['REST', 'SOAP', 'DIRECT', 'EVENT', 'EVENT', 'gRPC', 'GRAPHQL', 'A2A'],
    );
    expect(toServiceType('DIRECT')).toBe('GENERIC_REST');
    expect(toServiceType('SOAP')).toBe('SOAP_HTTP');
  });

  it('keeps milliseconds only when there are some', () => {
    expect(epochToIso(Date.UTC(2026, 10, 3, 9, 10, 4))).toBe('2026-11-03T09:10:04Z');
    expect(epochToIso(Date.UTC(2026, 10, 3, 9, 10, 4, 250))).toBe('2026-11-03T09:10:04.250Z');
  });

  it('reads the path from the Microcks operation name, the dispatcher fields, and the demo extras', () => {
    const op = fromOperationDto(
      { name: 'GET /pastries/{name}', method: 'GET', dispatcher: 'URI_PARTS', dispatcherRules: 'name', defaultDelay: 250 },
      { id: 'get-name', summary: 'Get a pastry', calls: 3, spark: [1, 2] },
    );
    expect(op).toEqual({ id: 'get-name', method: 'GET', path: '/pastries/{name}', summary: 'Get a pastry', calls: 3, spark: [1, 2], dispatcher: 'URI_PARTS', rule: 'name', delayMs: 250 });
    expect(fromOperationDto({ name: 'greeting', method: 'POST' }, undefined)).toMatchObject({ id: 'greeting', path: 'greeting', dispatcher: 'FALLBACK', rule: '' });
  });

  it('maps a request/response pair (string status, query parameters) and an event message to examples', () => {
    const pair: MicrocksExchange = {
      type: 'reqRespPair',
      request: { name: 'Millefeuille', operationId: 'GET /pastries/{name}', queryParameters: [{ name: 'name', value: 'Millefeuille' }] },
      response: { id: 'millefeuille', name: 'Millefeuille', operationId: 'GET /pastries/{name}', status: '200', content: '{}' },
    };
    expect(fromExchange(pair, { aiGenerated: true, reviewState: 'pending' })).toEqual({
      id: 'millefeuille',
      name: 'Millefeuille',
      request: { params: { name: 'Millefeuille' } },
      response: { status: 200, body: '{}' },
      aiGenerated: true,
      reviewState: 'pending',
    });
    const event: MicrocksExchange = { type: 'unidirEvent', eventMessage: { id: 'evt', name: 'Order created', operationId: 'PUBLISH orders', mediaType: 'application/json', content: '{"id":1}' } };
    expect(fromExchange(event)).toEqual({ id: 'evt', name: 'Order created', request: { params: {} }, response: { status: 200, body: '{"id":1}' } });
  });

  it('counts labels from GET /services/labels and the services, sorted by key=value, dropping unused pairs', () => {
    const services: Pick<MicrocksService, 'metadata'>[] = [{ metadata: { createdOn: 0, lastUpdate: 0, labels: { status: 'GA', domain: 'pastry' } } }, { metadata: { createdOn: 0, lastUpdate: 0, labels: { status: 'GA' } } }];
    expect(fromLabelsMap({ status: ['GA', 'beta'], domain: ['pastry'] }, services)).toEqual([
      { label: { key: 'domain', value: 'pastry' }, count: 1 },
      { label: { key: 'status', value: 'GA' }, count: 2 },
    ]);
  });
});

describe('domain -> Microcks DTO', () => {
  it('serialises a service as a Microcks Service and an operation with its dispatcher fields', async () => {
    const { catalog } = createInMemoryCatalogAdapters();
    const pastry2 = (await catalog.get('pastry2'))!;
    const dto = toServiceDto(pastry2, await catalog.operations('pastry2'), 'apipastries-openapi.yaml');
    expect(dto).toMatchObject({ id: 'pastry2', type: 'REST', sourceArtifact: 'apipastries-openapi.yaml', metadata: { labels: { domain: 'pastry', status: 'GA', team: 'bakery' } } });
    expect(dto.operations?.map((o) => o.name)).toEqual(['GET /pastries', 'GET /pastries/{name}', 'PATCH /pastries/{name}']);
    expect(toOperationDto((await catalog.operation('pastry2', 'get-list'))!)).toEqual({
      name: 'GET /pastries',
      method: 'GET',
      dispatcher: 'URI_PARAMS',
      dispatcherRules: 'size',
      defaultDelay: 0,
    });
  });

  it('serialises the examples of an event API as event messages, the others as request/response pairs', () => {
    const example: Example = { id: 'e', name: 'E', request: { params: {} }, response: { status: 200, body: '{}' } };
    expect(toExchange(example, 'PUBLISH orders', 'EVENT').type).toBe('unidirEvent');
    expect(toExchange(example, 'GET /x', 'REST')).toMatchObject({ type: 'reqRespPair', response: { id: 'e', status: '200' }, request: { responseId: 'e' } });
  });
});

describe('round trip over the seeded catalogue', () => {
  it('gives back every in-memory service, operation, example and label count', async () => {
    const { catalog } = createInMemoryCatalogAdapters();
    const services = await catalog.list();
    const dtos: MicrocksService[] = [];
    for (const service of services) {
      const operations = await catalog.operations(service.id);
      const examples = Object.fromEntries(await Promise.all(operations.map(async (o) => [o.id, await catalog.examples(service.id, o.id)] as const)));
      const dto = toServiceDto(service, operations, 'artifact');
      const demo = toServiceExtras(service, operations, examples);
      dtos.push(dto);

      expect(fromServiceDto(dto, demo)).toEqual(service);
      expect(dto.operations!.map((o) => fromOperationDto(o, demo.operations[o.name]))).toEqual(operations);
      for (const operation of operations) {
        const name = operationName(operation);
        const back = examples[operation.id]!.map((e) => fromExchange(toExchange(e, name, service.protocol), demo.operations[name]?.reviews?.[e.id]));
        expect(back).toEqual(examples[operation.id]);
      }
    }
    expect(fromLabelsMap(toLabelsMap(services), dtos)).toEqual(await catalog.labels());
  });
});
