import type { Protocol, OperationResult } from '@microcks/deep-ink';

export interface Service {
  id: string;
  name: string;
  version: string;
  protocol: Protocol;
  operations: number;
  calls: number;
  score: number | null;
  domain: string;
  format: string;
}

export const services: Service[] = [
  {
    id: 'pastry2',
    name: 'API Pastry',
    version: '2.0',
    protocol: 'REST',
    operations: 4,
    calls: 1248,
    score: 75,
    domain: 'pastry',
    format: 'OpenAPI 3.0',
  },
  {
    id: 'pastry1',
    name: 'API Pastry',
    version: '1.0',
    protocol: 'REST',
    operations: 3,
    calls: 312,
    score: 100,
    domain: 'pastry',
    format: 'OpenAPI 3.0',
  },
  {
    id: 'orders',
    name: 'Pastry orders API',
    version: '0.1.0',
    protocol: 'EVENT',
    operations: 2,
    calls: 864,
    score: 100,
    domain: 'pastry',
    format: 'AsyncAPI 2.6',
  },
  {
    id: 'hello-grpc',
    name: 'HelloService',
    version: 'v1',
    protocol: 'gRPC',
    operations: 1,
    calls: 56,
    score: null,
    domain: 'platform',
    format: 'Protobuf',
  },
  {
    id: 'movie',
    name: 'Movie Graph',
    version: '1.0',
    protocol: 'GRAPHQL',
    operations: 5,
    calls: 427,
    score: 60,
    domain: 'movies',
    format: 'GraphQL SDL',
  },
  {
    id: 'hello-soap',
    name: 'HelloService',
    version: '0.9',
    protocol: 'SOAP',
    operations: 2,
    calls: 91,
    score: 50,
    domain: 'platform',
    format: 'SoapUI',
  },
  {
    id: 'beer',
    name: 'Beer Catalog',
    version: '1.0',
    protocol: 'REST',
    operations: 3,
    calls: 108,
    score: null,
    domain: 'beer',
    format: 'OpenAPI 3.0',
  },
  {
    id: 'weather',
    name: 'Weather API',
    version: '1.0',
    protocol: 'DIRECT',
    operations: 2,
    calls: 42,
    score: null,
    domain: 'weather',
    format: 'Direct API',
  },
  {
    id: 'concierge',
    name: 'Pastry concierge',
    version: '1.0',
    protocol: 'A2A',
    operations: 3,
    calls: 128,
    score: 83,
    domain: 'pastry',
    format: 'Agent Card 1.0',
  },
];

export const protocols: Protocol[] = [
  'REST',
  'SOAP',
  'EVENT',
  'gRPC',
  'GRAPHQL',
  'DIRECT',
  'A2A',
];
export const operations = [
  {
    id: 'get-all',
    method: 'GET',
    path: '/pastries',
    examples: 1,
    dispatcher: 'DEFAULT',
    calls: 312,
  },
  {
    id: 'get-name',
    method: 'GET',
    path: '/pastries/{name}',
    examples: 3,
    dispatcher: 'URI_PARTS',
    calls: 642,
  },
  {
    id: 'patch-name',
    method: 'PATCH',
    path: '/pastries/{name}',
    examples: 2,
    dispatcher: 'URI_PARTS',
    calls: 184,
  },
  {
    id: 'post',
    method: 'POST',
    path: '/pastries',
    examples: 1,
    dispatcher: 'JSON_BODY',
    calls: 110,
  },
];
export const mockBase = 'http://microcks.local:8080/rest/API+Pastry/2.0';
export const run14 = '6729a1d27e4c0b5f93a8c214';
export const pastryJson = JSON.stringify(
  {
    name: 'Millefeuille',
    description: 'Vanilla cream pastry',
    price: 3.9,
    size: 'M',
  },
  null,
  2,
);
export const actualJson = JSON.stringify(
  {
    name: 'Millefeuille',
    description: 'Vanilla cream pastry',
    price: '3.9',
    size: 'M',
  },
  null,
  2,
);
export function outcomes(s: Service): OperationResult[] {
  return Array.from({ length: s.operations }, (_, i) =>
    s.score === null
      ? 'untested'
      : i < Math.round((s.operations * s.score) / 100)
        ? 'pass'
        : 'fail',
  );
}

export const screens = [
  {
    n: '01',
    title: 'Add a source',
    href: '/sources/new',
    phase: 'Import',
    detail: 'Upload, URL, Git or Direct API',
  },
  {
    n: '02',
    title: 'Sources',
    href: '/sources',
    phase: 'Import',
    detail: 'Imports and scheduled sync',
  },
  {
    n: '03',
    title: 'Cockpit',
    href: '/',
    phase: 'Explore',
    detail: 'Live mocks and conformance',
  },
  {
    n: '04',
    title: 'APIs & Services',
    href: '/services',
    phase: 'Explore',
    detail: 'Filterable catalogue and badge wall',
  },
  {
    n: '05',
    title: 'Service',
    href: '/services/pastry2',
    phase: 'Enrich',
    detail: 'Operations, examples and mock URLs',
  },
  {
    n: '06',
    title: 'Behavior',
    href: '/services/pastry2/operations/get-name',
    phase: 'Enrich',
    detail: 'Dispatcher and request simulator',
  },
  {
    n: '07',
    title: 'AI Copilot',
    href: '/services/pastry2/copilot',
    phase: 'Enrich',
    detail: 'Accept or reject proposed examples',
  },
  {
    n: '15',
    title: 'Workflows',
    href: '/workflows',
    phase: 'Orchestrate',
    detail: 'Arazzo documents and linked sources',
  },
  {
    n: '16',
    title: 'Workflow',
    href: '/workflows/pastry/restock-pastry',
    phase: 'Orchestrate',
    detail: 'Loom, steps and verification',
  },
  {
    n: '17',
    title: 'Workflow run',
    href: `/workflows/runs/${run14}`,
    phase: 'Orchestrate',
    detail: 'Criteria and schema validation',
  },
  {
    n: '08',
    title: 'Run a test',
    href: '/tests/create?service=pastry2',
    phase: 'Test',
    detail: 'Endpoint, runner, headers and CI snippet',
  },
  {
    n: '09',
    title: 'Live test',
    href: '/tests/runner/119',
    phase: 'Test',
    detail: 'Contract and actual response',
  },
  {
    n: '10',
    title: 'History',
    href: '/tests/service/pastry2',
    phase: 'Test',
    detail: 'Conformance timeline',
  },
  {
    n: '11',
    title: 'Usage & score',
    href: '/metrics/pastry2',
    phase: 'Observe',
    detail: 'Hourly invocations and scores',
  },
  {
    n: '12',
    title: 'Live traces',
    href: '/traces',
    phase: 'Observe',
    detail: 'Pause and inspect mock calls',
  },
  {
    n: '13',
    title: 'Hub',
    href: '/hub',
    phase: 'Govern',
    detail: 'Install public API packages',
  },
  {
    n: '14',
    title: 'Admin',
    href: '/admin',
    phase: 'Govern',
    detail: 'Users, groups, secrets and snapshots',
  },
  {
    n: '18',
    title: 'Agent',
    href: '/services/concierge/skills',
    phase: 'Agents',
    detail: 'Card, skills and task lifecycle',
  },
  {
    n: '19',
    title: 'Agent test',
    href: '/tests/agent/3',
    phase: 'Agents',
    detail: 'Conformance on three transports',
  },
];

export const nav = [
  { id: 'cockpit', label: 'Cockpit', href: '#/' },
  { id: 'catalogue', label: 'APIs & Services', href: '#/services' },
  { id: 'workflows', label: 'Workflows', href: '#/workflows' },
  { id: 'tests', label: 'Tests', href: '#/tests' },
  { id: 'sources', label: 'Sources', href: '#/sources' },
  { id: 'metrics', label: 'Usage & conformance', href: '#/metrics' },
  { id: 'traces', label: 'Live traces', href: '#/traces' },
  { id: 'hub', label: 'Hub', href: '#/hub' },
  { id: 'admin', label: 'Administration', href: '#/admin' },
];

export function readRoute(hash: string) {
  const url = new URL(hash.replace(/^#/, '') || '/', 'https://demo.invalid');
  return {
    path: url.pathname.replace(/\/$/, '') || '/',
    query: url.searchParams,
  };
}
export function navigate(path: string) {
  window.location.hash = path;
}
