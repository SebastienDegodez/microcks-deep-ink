import type { Behavior } from '@/domain/catalog';
import type { Example, Label, Operation, ServiceSummary } from '@/domain/shared';
import { labelFromString } from '@/domain/shared';

const L = (...texts: string[]): Label[] => texts.map(labelFromString);

const at = (iso: string) => `${iso}Z`;

/** The 10 services of the Catalogue prototype (`Catalogue.dc.html`). */
export const SERVICES: ServiceSummary[] = [
  { id: 'pastry2', name: 'API Pastry', version: '2.0', protocol: 'REST', format: 'OpenAPI 3.0.2', operationCount: 3, exampleCount: 7,
    lastResults: ['pass', 'pass', 'pass'], labels: L('domain=pastry', 'status=GA', 'team=bakery'), testStatus: 'passed',
    lastTest: { runId: '118', when: at('2026-11-03T07:10:04') }, conformance: 92, calls24h: 296, updatedAt: at('2026-11-03T07:10:04'), mcp: true },
  { id: 'orders', name: 'Pastry orders API', version: '0.1.0', protocol: 'EVENT', format: 'AsyncAPI 2.6 · Kafka', operationCount: 1,
    lastResults: ['pass'], labels: L('domain=pastry', 'status=beta'), testStatus: 'passed',
    lastTest: { runId: '41', when: at('2026-11-03T08:25:04') }, conformance: 100, calls24h: 1104, updatedAt: at('2026-11-03T08:25:04'), mcp: true },
  { id: 'movie', name: 'Movie Graph API', version: '1.0', protocol: 'GRAPHQL', format: 'GraphQL schema', operationCount: 4,
    lastResults: ['pass', 'pass', 'pass', 'fail'], labels: L('domain=movies', 'status=beta'), testStatus: 'failed',
    lastTest: { runId: '17', when: at('2026-11-03T03:10:04') }, conformance: 75, calls24h: 124, updatedAt: at('2026-11-03T03:10:04'), mcp: true },
  { id: 'hellogrpc', name: 'HelloService', version: 'v1', protocol: 'gRPC', format: 'Protobuf 3', operationCount: 1,
    lastResults: ['pass'], labels: L('status=GA', 'team=platform'), testStatus: 'passed',
    lastTest: { runId: '9', when: at('2026-11-02T08:00:04') }, conformance: 100, calls24h: 52, updatedAt: at('2026-11-02T08:00:04'), mcp: false },
  { id: 'petstore', name: 'Petstore API', version: '1.0.0', protocol: 'REST', format: 'OpenAPI 3.1', operationCount: 4,
    lastResults: null, labels: L('domain=pets', 'status=GA', 'team=platform'), testStatus: 'never',
    conformance: null, calls24h: 18, updatedAt: at('2026-11-02T00:00:04'), mcp: false },
  { id: 'pastry1', name: 'API Pastry', version: '1.0', protocol: 'REST', format: 'OpenAPI 3.0.2', operationCount: 3,
    lastResults: ['pass', 'pass', 'fail'], labels: L('domain=pastry', 'status=deprecated'), testStatus: 'failed',
    lastTest: { runId: '86', when: at('2026-10-31T08:00:04') }, conformance: 67, calls24h: 71, updatedAt: at('2026-10-31T08:00:04'), mcp: false },
  { id: 'rocks', name: 'Rocks', version: '0.1', protocol: 'DIRECT', format: 'Direct API · generic REST', operationCount: 5,
    lastResults: null, labels: L('status=beta', 'team=platform'), testStatus: 'never',
    conformance: null, calls24h: 1, updatedAt: at('2026-10-30T08:00:04'), mcp: false },
  { id: 'usersignedup', name: 'User signed-up API', version: '0.1.1', protocol: 'EVENT', format: 'AsyncAPI 2.4 · Kafka', operationCount: 1,
    lastResults: null, labels: L('domain=users', 'status=beta', 'team=platform'), testStatus: 'never',
    conformance: null, calls24h: 218, updatedAt: at('2026-10-29T08:00:04'), mcp: false },
  { id: 'hellosoap', name: 'HelloService Mock', version: '0.9', protocol: 'SOAP', format: 'SoapUI project · WSDL 1.1', operationCount: 1,
    lastResults: ['pass'], labels: L('domain=legacy', 'status=GA'), testStatus: 'passed',
    lastTest: { runId: '33', when: at('2026-10-20T08:00:04') }, conformance: 100, calls24h: 9, updatedAt: at('2026-10-20T08:00:04'), mcp: false },
  { id: 'beer', name: 'Beer Catalog API', version: '0.9', protocol: 'REST', format: 'Postman collection v2.1', operationCount: 3,
    lastResults: ['pass', 'fail', 'fail'], labels: L('domain=beer', 'status=beta'), testStatus: 'failed',
    lastTest: { runId: '5', when: at('2026-10-13T08:00:04') }, conformance: 33, calls24h: 3, updatedAt: at('2026-10-13T08:00:04'), mcp: false },
  { id: 'concierge', name: 'Pastry concierge', version: '1.0', protocol: 'A2A', format: 'A2A Agent Card · spec 1.0', operationCount: 3,
    lastResults: ['pass', 'fail', 'fail'], labels: L('domain=pastry', 'status=beta'), testStatus: 'failed',
    lastTest: { runId: '3', when: at('2026-11-03T08:10:04') }, conformance: 83, calls24h: 64, updatedAt: at('2026-11-03T08:41:04'), mcp: false },
];

const op = (id: string, method: string, path: string, summary: string, calls: number, spark: number[], extra: Partial<Operation> = {}): Operation => ({
  id, method, path, summary, calls, spark, dispatcher: 'URI_PARTS', rule: 'name', delayMs: 0, ...extra,
});

/** Operations by service. pastry2 comes from `Service.dc.html`; the others are plausible stubs for WP7 to enrich. */
export const OPERATIONS: Record<string, Operation[]> = {
  pastry2: [
    op('get-list', 'GET', '/pastries', 'List pastries by size', 412, [38, 52, 61, 47, 70, 88, 56], { dispatcher: 'URI_PARAMS', rule: 'size', mcpTool: 'get_pastries' }),
    op('get-name', 'GET', '/pastries/{name}', 'Get a pastry by its name', 1284, [140, 162, 175, 190, 168, 221, 228], { mcpTool: 'get_pastries_name' }),
    op('patch-name', 'PATCH', '/pastries/{name}', 'Update price or availability', 96, [9, 14, 12, 18, 11, 20, 12], { mcpTool: 'patch_pastries_name' }),
  ],
  orders: [op('publish-order', 'PUBLISH', 'pastry-orders-events', 'Order events', 1104, [140, 150, 160, 150, 165, 170, 169], { dispatcher: 'JSON_BODY', rule: '/orderId' })],
  movie: [
    op('movies', 'QUERY', 'movies', 'List movies', 60, [8, 9, 7, 10, 8, 9, 9], { dispatcher: 'QUERY_ARGS', rule: 'title' }),
    op('movie', 'QUERY', 'movie', 'Get a movie', 30, [4, 5, 4, 5, 4, 4, 4], { dispatcher: 'QUERY_ARGS', rule: 'id' }),
    op('people', 'QUERY', 'people', 'List people', 20, [3, 3, 2, 3, 3, 3, 3], { dispatcher: 'QUERY_ARGS', rule: 'name' }),
    op('add-review', 'MUTATION', 'addReview', 'Add a review', 14, [2, 2, 2, 2, 2, 2, 2], { dispatcher: 'QUERY_ARGS', rule: 'movieId' }),
  ],
  hellogrpc: [op('greeting', 'RPC', 'HelloService/greeting', 'Say hello', 52, [7, 8, 7, 8, 7, 8, 7], { dispatcher: 'QUERY_ARGS', rule: 'firstname' })],
  petstore: [
    op('list-pets', 'GET', '/pets', 'List pets', 8, [1, 1, 2, 1, 1, 1, 1], { dispatcher: 'URI_PARAMS', rule: 'limit' }),
    op('create-pet', 'POST', '/pets', 'Create a pet', 3, [0, 1, 0, 1, 0, 1, 0], { dispatcher: 'JSON_BODY', rule: '/name' }),
    op('get-pet', 'GET', '/pets/{petId}', 'Get a pet', 5, [1, 1, 1, 1, 0, 1, 0], { rule: 'petId' }),
    op('delete-pet', 'DELETE', '/pets/{petId}', 'Delete a pet', 2, [0, 0, 1, 0, 0, 1, 0], { rule: 'petId' }),
  ],
  pastry1: [
    op('get-list', 'GET', '/pastries', 'List pastries', 30, [4, 4, 5, 4, 4, 5, 4], { dispatcher: 'URI_PARAMS', rule: 'size' }),
    op('get-name', 'GET', '/pastries/{name}', 'Get a pastry by its name', 36, [5, 5, 5, 6, 5, 5, 5]),
    op('patch-name', 'PATCH', '/pastries/{name}', 'Update a pastry', 5, [1, 0, 1, 1, 1, 0, 1]),
  ],
  rocks: [
    op('list', 'GET', '/rocks', 'List rocks', 1, [0, 0, 0, 0, 0, 0, 1], { dispatcher: 'FALLBACK', rule: '' }),
    op('get', 'GET', '/rocks/{id}', 'Get a rock', 0, [0, 0, 0, 0, 0, 0, 0], { rule: 'id' }),
    op('create', 'POST', '/rocks', 'Create a rock', 0, [0, 0, 0, 0, 0, 0, 0], { dispatcher: 'FALLBACK', rule: '' }),
    op('update', 'PUT', '/rocks/{id}', 'Update a rock', 0, [0, 0, 0, 0, 0, 0, 0], { rule: 'id' }),
    op('delete', 'DELETE', '/rocks/{id}', 'Delete a rock', 0, [0, 0, 0, 0, 0, 0, 0], { rule: 'id' }),
  ],
  usersignedup: [op('user-signedup', 'SUBSCRIBE', 'user-signedup', 'User signed up', 218, [30, 31, 32, 31, 30, 32, 32], { dispatcher: 'JSON_BODY', rule: '/id' })],
  hellosoap: [op('say-hello', 'POST', 'sayHello', 'Say hello', 9, [1, 1, 2, 1, 1, 2, 1], { dispatcher: 'QUERY_ARGS', rule: 'name' })],
  concierge: [
    op('recommend-pastry', 'SKILL', 'recommend-pastry', 'Recommend a pastry', 29, [3, 4, 4, 5, 4, 5, 4], { dispatcher: 'QUERY_ARGS', rule: 'metadata.skillId' }),
    op('order-pastry', 'SKILL', 'order-pastry', 'Order a pastry', 14, [2, 2, 1, 3, 2, 2, 2], { dispatcher: 'QUERY_ARGS', rule: 'metadata.skillId' }),
    op('track-order', 'SKILL', 'track-order', 'Track an order', 18, [2, 3, 2, 3, 3, 2, 3], { dispatcher: 'QUERY_ARGS', rule: 'metadata.skillId' }),
  ],
  beer: [
    op('find-beer', 'GET', '/beers', 'Find beers', 1, [0, 0, 0, 0, 0, 0, 1], { dispatcher: 'URI_PARAMS', rule: 'name' }),
    op('get-beer', 'GET', '/beers/{name}', 'Get a beer', 1, [0, 0, 0, 0, 0, 0, 1]),
    op('reserve-beer', 'POST', '/beers/{name}/reserve', 'Reserve a beer', 1, [0, 0, 0, 0, 0, 0, 1], { dispatcher: 'JSON_BODY', rule: '/quantity' }),
  ],
};

const json = (value: unknown) => JSON.stringify(value, null, 2);

const PASTRIES = {
  mille: { name: 'Millefeuille', description: 'Delicious Millefeuille, not caloric at all', size: 'L', price: 4.4, status: 'available' },
  cafe: { name: 'Eclair Cafe', description: 'Delicious Coffee Eclair, not caloric at all', size: 'M', price: 2.5, status: 'available' },
  choco: { name: 'Eclair Chocolat', description: 'Delicious Chocolate Eclair, not caloric at all', size: 'M', price: 2.4, status: 'unknown' },
  fraise: { name: 'Tartelette Fraise', description: 'Delicious Strawberry Tartlet, fresh strawberries', size: 'S', price: 2.0, status: 'available' },
  tarte: { name: 'Tartelette Framboise', description: 'Raspberry tartlet with fresh raspberries on pastry cream', size: 'S', price: 3.1, status: 'available' },
} as const;

const ok = (body: unknown) => ({ status: 200, body: json(body) });

/** Examples of API Pastry 2.0 by operation id (7 human examples + the pending AI one, Tartelette Framboise). */
export const PASTRY2_EXAMPLES: Record<string, Example[]> = {
  'get-list': [
    { id: 'size-s', name: 'Size S', request: { params: { size: 'S' } }, response: ok([PASTRIES.fraise]) },
    { id: 'size-m', name: 'Size M', request: { params: { size: 'M' } }, response: ok([PASTRIES.cafe, PASTRIES.choco]) },
    { id: 'size-l', name: 'Size L', request: { params: { size: 'L' } }, response: ok([PASTRIES.mille]) },
  ],
  'get-name': [
    { id: 'millefeuille', name: 'Millefeuille', request: { params: { name: 'Millefeuille' } }, response: ok(PASTRIES.mille) },
    { id: 'eclair-cafe', name: 'Eclair Cafe', request: { params: { name: 'Eclair Cafe' } }, response: ok(PASTRIES.cafe) },
    { id: 'eclair-chocolat', name: 'Eclair Chocolat', request: { params: { name: 'Eclair Chocolat' } }, response: ok(PASTRIES.choco) },
    { id: 'tartelette', name: 'Tartelette Framboise', request: { params: { name: 'Tartelette Framboise' } }, response: ok(PASTRIES.tarte),
      aiGenerated: true, reviewState: 'pending' },
  ],
  'patch-name': [
    { id: 'choco-price', name: 'Eclair Chocolat · price', request: { params: { name: 'Eclair Chocolat' }, body: json({ price: 2.6 }) },
      response: ok({ ...PASTRIES.choco, price: 2.6 }) },
  ],
};

export const PASTRY2_BEHAVIOR_DEFAULT: Behavior = {
  dispatcher: 'URI_PARTS',
  rule: 'name',
  delayMs: 0,
  constraints: [],
  stateful: false,
};
