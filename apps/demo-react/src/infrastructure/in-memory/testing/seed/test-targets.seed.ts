import type { TestTarget } from '@/domain/testing';

const REST_HELP = 'HTTP(S) base URL of the implementation. Microcks appends each operation path to it.';

/** The services of the "Run a test" prototype: contract artifacts, runners, operations and recent endpoints. */
export const TEST_TARGETS: TestTarget[] = [
  {
    serviceId: 'pastry2', type: 'REST', artifacts: 'OpenAPI 3.0.2 + Postman collection', lastTest: { ok: true, text: 'passed · 2 h ago' },
    endpoint: 'https://pastry.staging.acme.io/v2', endpointHelp: REST_HELP,
    runners: [
      { id: 'HTTP' }, { id: 'OPEN_API_SCHEMA', recommended: true }, { id: 'POSTMAN' },
      { id: 'SOAP_UI', unavailableReason: 'Needs a SoapUI project: none imported' },
    ],
    operations: [
      { id: 'get-list', verb: 'GET', name: 'GET /pastries', path: '/pastries', samples: 3 },
      { id: 'get-name', verb: 'GET', name: 'GET /pastries/{name}', path: '/pastries/{name}', samples: 3 },
      { id: 'patch-name', verb: 'PATCH', name: 'PATCH /pastries/{name}', path: '/pastries/{name}', samples: 1 },
    ],
    recentEndpoints: [
      { env: 'staging', url: 'https://pastry.staging.acme.io/v2' },
      { env: 'prod', url: 'https://pastry.acme.io/v2' },
      { env: 'local', url: 'http://localhost:8282/v2' },
    ],
  },
  {
    serviceId: 'pastry1', type: 'REST', artifacts: 'OpenAPI 3.0.2', lastTest: { ok: false, text: 'failed · 3 d ago' },
    endpoint: 'https://pastry.staging.acme.io/v1', endpointHelp: REST_HELP,
    runners: [{ id: 'HTTP' }, { id: 'OPEN_API_SCHEMA', recommended: true }, { id: 'POSTMAN', unavailableReason: 'Needs a Postman collection: none imported' }],
    operations: [
      { id: 'get-list', verb: 'GET', name: 'GET /pastries', path: '/pastries', samples: 3 },
      { id: 'get-name', verb: 'GET', name: 'GET /pastries/{name}', path: '/pastries/{name}', samples: 1 },
      { id: 'patch-name', verb: 'PATCH', name: 'PATCH /pastries/{name}', path: '/pastries/{name}', samples: 1 },
    ],
    recentEndpoints: [],
  },
  {
    serviceId: 'orders', type: 'EVENT', artifacts: 'AsyncAPI 2.6', lastTest: { ok: true, text: 'passed · 45 min ago' },
    endpoint: 'kafka://kafka.staging.acme.io:9092/PastryordersAPI-0.1.0-pastry-orders',
    endpointHelp: 'Broker URL and topic or channel, e.g. kafka://host:9092/topic. Options go after a ?, separated by &.',
    runners: [{ id: 'ASYNC_API_SCHEMA', recommended: true }],
    operations: [{ id: 'publish-order', verb: 'SUB', name: 'SUBSCRIBE pastry/orders', path: 'pastry/orders', samples: 2 }],
    recentEndpoints: [],
  },
  {
    serviceId: 'hellogrpc', type: 'GRPC', artifacts: 'Protobuf + examples', lastTest: { ok: true, text: 'passed · yesterday' },
    endpoint: 'grpc://hello.staging.acme.io:9000', endpointHelp: 'gRPC server host and port, e.g. grpc://host:9000.',
    runners: [{ id: 'GRPC_PROTOBUF', recommended: true }],
    operations: [{ id: 'greeting', verb: 'RPC', name: 'greeting', path: 'greeting', samples: 2 }],
    recentEndpoints: [],
  },
  {
    serviceId: 'movie', type: 'GRAPHQL', artifacts: 'GraphQL schema + Postman collection', lastTest: { ok: false, text: 'failed · 6 h ago' },
    endpoint: 'https://movies.staging.acme.io/graphql', endpointHelp: 'URL of the GraphQL endpoint of the implementation.',
    runners: [{ id: 'HTTP' }, { id: 'GRAPHQL_SCHEMA', recommended: true }, { id: 'POSTMAN' }],
    operations: [
      { id: 'movies', verb: 'QUERY', name: 'allFilms', path: 'allFilms', samples: 1 },
      { id: 'movie', verb: 'QUERY', name: 'film', path: 'film', samples: 2 },
      { id: 'people', verb: 'QUERY', name: 'filmsByActor', path: 'filmsByActor', samples: 1 },
      { id: 'add-review', verb: 'MUTATION', name: 'addStar', path: 'addStar', samples: 1 },
    ],
    recentEndpoints: [],
  },
  {
    serviceId: 'hellosoap', type: 'SOAP_HTTP', artifacts: 'SoapUI project', lastTest: { ok: true, text: 'passed · 2 wk ago' },
    endpoint: 'https://hello-ws.staging.acme.io/HelloService', endpointHelp: 'URL of the deployed WebService endpoint.',
    runners: [{ id: 'HTTP' }, { id: 'SOAP_HTTP', recommended: true }, { id: 'SOAP_UI' }],
    operations: [{ id: 'say-hello', verb: 'OP', name: 'sayHello', path: 'sayHello', samples: 2 }],
    recentEndpoints: [],
  },
  {
    serviceId: 'beer', type: 'REST', artifacts: 'Postman collection', lastTest: { ok: false, text: 'failed · 3 wk ago' },
    endpoint: 'https://beer.staging.acme.io/api', endpointHelp: REST_HELP,
    runners: [{ id: 'HTTP' }, { id: 'POSTMAN', recommended: true }, { id: 'OPEN_API_SCHEMA', unavailableReason: 'Needs an OpenAPI contract: none imported' }],
    operations: [
      { id: 'get-beer', verb: 'GET', name: 'GET /beer', path: '/beer', samples: 1 },
      { id: 'get-beer-name', verb: 'GET', name: 'GET /beer/{name}', path: '/beer/{name}', samples: 2 },
      { id: 'find-by-status', verb: 'GET', name: 'GET /beer/findByStatus/{status}', path: '/beer/findByStatus/{status}', samples: 1 },
    ],
    recentEndpoints: [],
  },
];
