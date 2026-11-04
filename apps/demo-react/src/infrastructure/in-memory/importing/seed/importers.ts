import type { ArtifactKind, Importer, SourceOrigin, ProducedService, SyncChange, SyncEntry, SyncResult } from '@/domain/importing';
import { labelFromString } from '@/domain/shared';

/** Absolute time: `at(11, 3, 9, 0)` is Nov 3 09:00 UTC. Today is Nov 3, 2026 09:10:04 (the demo clock). */
const at = (month: number, day: number, hour: number, minute = 0) => new Date(Date.UTC(2026, month, day, hour, minute)).toISOString();
const NOV = 10 as const;
const OCT = 9 as const;
const RAW = 'https://raw.githubusercontent.com/microcks/microcks/master/samples/';

const run = (
  id: string,
  when: string,
  trigger: string,
  result: SyncResult,
  extra: { changes?: SyncChange[]; note?: string; revision?: string } = {},
): SyncEntry => ({ kind: 'run', id, at: when, trigger, result, changes: extra.changes ?? [], note: extra.note, revision: extra.revision });
const group = (id: string, text: string): SyncEntry => ({ kind: 'group', id, text });
const add = (text: string): SyncChange => ({ sign: '+', text });
const change = (text: string): SyncChange => ({ sign: '~', text });
const skipped = (text: string): SyncChange => ({ sign: '!', text });

const svc = (protocol: ProducedService['protocol'], name: string, version: string, id?: string): ProducedService => ({ protocol, name, version, id });

interface Job {
  id: string;
  name: string;
  url: string;
  main: boolean;
  kind: ArtifactKind;
  origin?: SourceOrigin;
  label: string;
  secret?: string;
  secretType?: string;
  ssl: boolean;
  labels: string;
  created: string;
  createdBy?: string;
  active: boolean;
  health: Importer['health'];
  produces: ProducedService[];
  workflows?: string;
  producedLabel?: string;
  artifactNote?: string;
  error?: Importer['error'];
  warning?: string;
  timeline: SyncEntry[];
  running?: boolean;
}

const ORIGIN_OF: Record<string, SourceOrigin> = {
  'pastry-openapi': 'url',
  'pastry-postman': 'url',
  'pastry-workflows': 'git',
  'pastry-workflows-sources': 'git',
  'pastry-orders': 'git',
  'user-signedup': 'git',
  'hello-grpc': 'hub',
  'hello-soap': 'hub',
  'movie-graph': 'url',
  'beer-catalog': 'url',
};

const JOBS: Job[] = [
  {
    id: 'pastry-openapi', name: 'API Pastry 2.0 · OpenAPI', url: `${RAW}APIPastry-openapi.yaml`, main: true, kind: 'openapi', label: 'OPEN_API_SPEC',
    ssl: true, labels: 'domain=pastry · team=bakery', created: at(6, 14, 10, 21), active: true, health: 'imported',
    produces: [svc('REST', 'API Pastry', '2.0', 'pastry2')],
    timeline: [
      run('e1', at(NOV, 3, 9), 'Scheduled', 'imported'),
      group('g1', '1 scheduled scan, no change · 08:00'),
      run('e2', at(NOV, 3, 7, 14), 'Forced by MA', 'imported', { changes: [add('1 operation'), change('2 examples')], revision: '3c9e1d0 → a41f9c2' }),
      group('g2', '110 scheduled scans, no change · Oct 29 – Nov 3'),
      run('e3', at(OCT, 29, 14), 'Scheduled', 'imported', { changes: [change('1 example')], revision: 'f07b2e4 → 3c9e1d0' }),
      run('e4', at(6, 14, 10, 21), 'Created by MA', 'imported', { note: 'initial import · 2 operations, 6 examples' }),
    ],
  },
  {
    id: 'pastry-postman', name: 'API Pastry 2.0 · Postman examples', url: `${RAW}APIPastry-postman-collection.json`, main: false, kind: 'postman', label: 'POSTMAN_COLLECTION',
    ssl: true, labels: 'domain=pastry', created: at(6, 14, 10, 24), active: true, health: 'imported',
    produces: [svc('REST', 'API Pastry', '2.0', 'pastry2')],
    timeline: [
      run('e1', at(NOV, 3, 9), 'Scheduled', 'imported'),
      group('g1', '1 scheduled scan, no change · 08:00'),
      run('e2', at(NOV, 3, 7, 15), 'Forced by MA', 'imported', { changes: [add('1 example')], revision: '9a1c4f0 → 2be8d31' }),
      run('e3', at(6, 14, 10, 24), 'Created by MA', 'imported', { note: 'merged into API Pastry 2.0 · 0 examples' }),
    ],
  },
  {
    id: 'pastry-workflows', name: 'Pastry workflows', url: 'https://raw.githubusercontent.com/bakery-platform/contracts/main/arazzo/pastry-workflows.arazzo.yaml',
    main: true, kind: 'arazzo', label: 'Arazzo 1.1.0', secret: 'github-contracts', secretType: 'Token · Authorization: Bearer', ssl: true,
    labels: 'domain=pastry · team=bakery', created: at(OCT, 30, 17, 45), active: true, health: 'imported', produces: [], workflows: '4 workflows',
    artifactNote: 'Creates or updates workflows · each source description is linked to a Microcks API',
    timeline: [
      run('e1', at(NOV, 3, 9), 'Scheduled', 'imported'),
      group('g1', '1 scheduled scan, no change · 08:00'),
      run('e2', at(NOV, 3, 7, 20), 'Forced by MA', 'imported', { changes: [add('2 workflows'), change('arazzo 1.1.0'), change('info.version')], revision: '8b21e5a → d90c4f7' }),
      run('e3', at(OCT, 30, 17, 45), 'Created by MA', 'imported', { note: 'initial import · 2 workflows, 7 steps · 2 source descriptions linked' }),
    ],
  },
  {
    id: 'pastry-workflows-sources', name: 'Pastry workflows · ArazzoSources overlay',
    url: 'https://raw.githubusercontent.com/bakery-platform/contracts/main/arazzo/pastry-workflows.arazzo-sources.yaml', main: false, kind: 'arazzo',
    label: 'ArazzoSources', secret: 'github-contracts', secretType: 'Token · Authorization: Bearer', ssl: true, labels: 'domain=pastry · team=bakery',
    created: at(OCT, 30, 17, 46), active: true, health: 'imported', produces: [], workflows: 'links sources, carries examples', producedLabel: 'Overlay of',
    artifactNote: 'pastry-workflows.arazzo-sources.yaml · links sources, carries examples · matched by document title + version',
    timeline: [
      run('e1', at(NOV, 3, 9), 'Scheduled', 'imported'),
      group('g1', '1 scheduled scan, no change · 08:00'),
      run('e2', at(NOV, 3, 7, 21), 'Forced by MA', 'imported', { changes: [add('1 link'), add('1 example')], revision: '8b21e5a → d90c4f7' }),
      run('e3', at(OCT, 30, 17, 46), 'Created by MA', 'imported', { note: 'initial import · 2 sources linked, 1 example of restock-pastry' }),
    ],
  },
  {
    id: 'pastry-orders', name: 'Pastry orders events',
    url: 'https://gitlab.bakery.internal/api/v4/projects/42/repository/files/asyncapi%2Fpastry-orders-asyncapi.yaml/raw?ref=main', main: true, kind: 'asyncapi',
    label: 'ASYNC_API_SPEC', secret: 'gitlab-bakery', secretType: 'Token · header PRIVATE-TOKEN', ssl: true, labels: 'domain=pastry · team=orders',
    created: at(8, 18, 15, 2), active: true, health: 'failed', produces: [svc('EVENT', 'Pastry orders API', '0.1.0', 'orders')],
    error: {
      message: '401 Unauthorized — check secret', since: '5 failed scans since 05:00',
      detail: 'GitLab rejects the token held in secret gitlab-bakery (Token, header PRIVATE-TOKEN). It may have expired or lost access to the project.',
      servedSince: 'Nov 3 · 04:00',
    },
    timeline: [
      run('e1', at(NOV, 3, 9), 'Scheduled', 'failed', { note: '401 Unauthorized' }),
      group('g1', '3 failed scans, same error · 06:00 – 08:00'),
      run('e2', at(NOV, 3, 5), 'Scheduled', 'failed', { note: '401 Unauthorized · first failure' }),
      run('e3', at(NOV, 3, 4), 'Scheduled', 'imported', { note: 'no contract change · version still served' }),
      run('e4', at(OCT, 31, 16), 'Scheduled', 'imported', { changes: [add('1 property'), change('1 example')], revision: '5d2a7c8 → c81e09b' }),
      run('e5', at(8, 18, 15, 2), 'Created by MA', 'imported', { note: 'initial import · 1 operation, 2 examples' }),
    ],
  },
  {
    id: 'user-signedup', name: 'User signed-up events', url: 'https://raw.githubusercontent.com/bakery-platform/contracts/main/asyncapi/UserSignedUpAPI-asyncapi.yml',
    main: true, kind: 'asyncapi', label: 'ASYNC_API_SPEC', secret: 'github-contracts', secretType: 'Token · Authorization: Bearer', ssl: true,
    labels: 'domain=identity', created: at(OCT, 21, 9, 40), active: true, health: 'warning', produces: [svc('EVENT', 'User signed-up API', '0.1.1', 'usersignedup')],
    warning: '1 message example skipped: payload does not match the schema (required "email" missing).',
    timeline: [
      run('e1', at(NOV, 3, 9), 'Scheduled', 'warning', { changes: [change('1 example'), skipped('1 skipped')], revision: '71fe0a2 → 0d4b6e9' }),
      group('g1', '16 scheduled scans, no change · Nov 2 – Nov 3'),
      run('e2', at(NOV, 2, 18), 'Scheduled', 'imported', { changes: [add('1 example')], revision: 'b3390cd → 71fe0a2' }),
      run('e3', at(OCT, 21, 9, 40), 'Created by MA', 'imported', { note: 'initial import · 1 operation, 1 example' }),
    ],
  },
  {
    id: 'hello-grpc', name: 'HelloService gRPC', url: `${RAW}hello-v1.proto`, main: true, kind: 'grpc', label: 'PROTOBUF', ssl: true, labels: 'domain=greeting',
    created: at(8, 3, 11, 30), active: true, health: 'imported', produces: [svc('gRPC', 'HelloService', 'v1', 'hellogrpc')],
    timeline: [
      run('e1', at(NOV, 3, 9), 'Scheduled', 'imported'),
      group('g1', '1,412 scheduled scans, no change · Sep 3 – Nov 3'),
      run('e2', at(8, 3, 11, 30), 'Created by MA', 'imported', { note: 'initial import · 1 operation' }),
    ],
  },
  {
    id: 'hello-soap', name: 'HelloService SOAP', url: `${RAW}HelloService-soapui-project.xml`, main: true, kind: 'soap', label: 'SOAP_UI', ssl: false,
    labels: 'domain=greeting · legacy=true', created: at(8, 3, 11, 34), active: true, health: 'imported', produces: [svc('SOAP', 'HelloService Mock', '0.9', 'hellosoap')],
    timeline: [
      run('e1', at(NOV, 3, 9), 'Scheduled', 'imported'),
      group('g1', '1,412 scheduled scans, no change · Sep 3 – Nov 3'),
      run('e2', at(8, 3, 11, 34), 'Created by MA', 'imported', { note: 'initial import · 1 operation, 2 examples' }),
    ],
  },
  {
    id: 'movie-graph', name: 'Movie Graph API', url: `${RAW}films.graphql`, main: true, kind: 'graphql', label: 'GRAPHQL_SCHEMA', ssl: true, labels: 'domain=media',
    created: at(8, 12, 16, 5), active: false, health: 'imported', produces: [svc('GRAPHQL', 'Movie Graph API', '1.0', 'movie')],
    timeline: [
      run('e1', at(OCT, 30, 15, 40), 'Stopped by MA', 'paused', { note: 'scans paused, Service kept as is' }),
      run('e2', at(OCT, 30, 14), 'Scheduled', 'imported', { changes: [add('1 operation')], revision: 'e4a0b17 → 6f2c9d3' }),
      run('e3', at(8, 12, 16, 5), 'Created by MA', 'imported', { note: 'initial import · 3 operations' }),
    ],
  },
  {
    id: 'beer-catalog', name: 'Beer Catalog API', url: 'https://api.getpostman.com/collections/18324759-2b6f7e2a-5c1d-4b8e-9f0a-3e7d1c6b4a90', main: true,
    kind: 'postman', label: 'POSTMAN_COLLECTION', secret: 'postman-api', secretType: 'Token · header X-Api-Key', ssl: true, labels: 'domain=beer',
    created: at(7, 6, 13, 12), active: true, health: 'imported', running: true, produces: [svc('REST', 'Beer Catalog API', '0.9', 'beer')],
    timeline: [
      run('e1', at(NOV, 3, 9), 'Scheduled', 'imported'),
      group('g1', '48 scheduled scans, no change · Nov 1 – Nov 3'),
      run('e2', at(NOV, 1, 10), 'Scheduled', 'imported', { changes: [add('1 example')], revision: 'aa04f3e → 1c7d5b2' }),
      run('e3', at(7, 6, 13, 12), 'Created by MA', 'imported', { note: 'initial import · 3 operations, 8 examples' }),
    ],
  },  {
    id: 'upload-agent-card', name: 'Pastry concierge · Agent Card', url: 'agent-card.json · uploaded file · 3.2 KB', main: true, kind: 'a2a', origin: 'upload',
    label: 'A2A_AGENT_CARD', ssl: true, labels: 'domain=pastry · status=beta', created: at(NOV, 3, 8, 10), active: true, health: 'imported',
    produces: [svc('A2A', 'Pastry concierge', '1.0', 'concierge')],
    artifactNote: 'A2A Agent Card · spec 1.0 · 3 skills become operations · Projection, v2 module',
    timeline: [
      run('e1', at(NOV, 3, 8, 10), 'Uploaded by MA', 'imported', { note: 'one-off upload · 3 skills, 3 interfaces (JSONRPC, HTTP+JSON, GRPC)' }),
    ],
  },
  {
    id: 'upload-postman', name: 'API Pastry 2.0 · Postman upload', url: 'apipastry-2.0-postman.json · uploaded file · 18 KB', main: false, kind: 'postman', origin: 'upload',
    label: 'POSTMAN_COLLECTION', ssl: true, labels: 'domain=pastry', created: at(OCT, 31, 16, 40), active: true, health: 'imported',
    produces: [svc('REST', 'API Pastry', '2.0', 'pastry2')],
    timeline: [
      run('e1', at(OCT, 31, 16, 40), 'Uploaded by MA', 'imported', { note: 'one-off upload · merged 3 examples into API Pastry 2.0' }),
    ],
  },
];

export function seedImporters(): Importer[] {
  return JOBS.map<Importer>((j) => {
    const lastRun = j.timeline.find((e) => e.kind === 'run');
    return {
      id: j.id,
      name: j.name,
      source: { kind: 'url', url: j.url, secretName: j.secret },
      kind: j.kind,
      origin: j.origin ?? ORIGIN_OF[j.id] ?? 'url',
      active: j.origin === 'upload' ? true : j.active,
      state: j.running ? 'running' : j.health === 'failed' ? 'failed' : 'idle',
      schedule: (j.origin ?? ORIGIN_OF[j.id]) === 'upload' ? 'no schedule · one-off' : 'every hour',
      lastSyncAt: lastRun?.kind === 'run' ? lastRun.at : undefined,
      secretName: j.secret,
      versions: j.timeline
        .filter((e): e is Extract<SyncEntry, { kind: 'run' }> => e.kind === 'run' && Boolean(e.revision))
        .map((e) => ({ id: e.id, label: e.revision?.split('→')[1]?.trim() ?? e.id, syncedAt: e.at, summary: e.changes.map((c) => c.text).join(', ') })),
      url: j.url,
      role: j.main ? 'primary' : 'secondary',
      artifactLabel: j.label,
      artifactNote: j.artifactNote,
      secretType: j.secretType,
      sslValidation: j.ssl,
      labels: j.labels.split('·').map((x) => labelFromString(x.trim())),
      createdAt: j.created,
      createdBy: j.createdBy ?? 'MA',
      produces: j.produces,
      workflows: j.workflows,
      producedLabel: j.producedLabel,
      health: j.health,
      error: j.error,
      warning: j.warning,
      timeline: j.timeline,
    };
  });
}
