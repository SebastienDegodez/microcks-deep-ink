import type {
  AgentPreview, ArazzoPreview, DetectedService, ImportOptions, ImportPreview, ImportResult, ImportSource, Importer, ImporterDiff, RecentImport,
} from '@/domain/importing';
import { detectArtifactKind, directApiEndpoint, nameFromFile } from '@/domain/importing';
import type { SecretSummary } from '@/domain/shared';
import { NotFoundError, ValidationError } from '@/application/shared';
import type { Clock } from '@/application/ports/shared';
import type { ImportHistory } from '@/application/importing';
import type { ImportGateway, ImporterRepository, SecretRepository } from '@/application/ports/importing';
import { FixedClock, SECRET_STAGING, after, createSequenceStream, type InMemoryDeps } from '../shared';
import { DIFFS } from './seed/diffs';
import { seedImporters } from './seed/importers';

export interface ImportingAdapters {
  gateway: ImportGateway;
  importers: ImporterRepository;
  secrets: SecretRepository;
  history: ImportHistory;
  clock: Clock;
}

const SEED_SECRETS: SecretSummary[] = [
  { id: 'sec-1', name: SECRET_STAGING, kind: 'oauth2', description: 'Client credentials for the pastry staging API', masked: '••••••••3f2a', createdAt: '2026-09-12T08:00:00Z' },
  { id: 'sec-2', name: 'github-readonly', kind: 'token', description: 'Read-only token for the Git importers', masked: '••••••••c91d', createdAt: '2026-08-02T08:00:00Z' },
  { id: 'sec-3', name: 'github-contracts', kind: 'token', description: 'Bearer token for the bakery-platform/contracts repository', masked: '••••••••a7e0', createdAt: '2026-10-30T17:40:00Z' },
  { id: 'sec-4', name: 'gitlab-bakery', kind: 'token', description: 'PRIVATE-TOKEN for the internal GitLab', masked: '••••••••51bc', createdAt: '2026-09-18T15:00:00Z' },
  { id: 'sec-5', name: 'postman-api', kind: 'token', description: 'X-Api-Key of the Postman workspace', masked: '••••••••9d42', createdAt: '2026-08-06T13:10:00Z' },
];

const RECENT: RecentImport[] = [
  { id: 'r1', protocol: 'ARAZZO', name: 'Pastry workflows', at: '2026-11-03T07:20:00Z', via: 'Git repository · scheduled', status: 'imported', statusText: 'Imported', note: '4 workflows · 14 steps · 3 sources linked' },
  { id: 'r2', protocol: 'REST', name: 'API Pastry 2.0', at: '2026-11-03T07:14:00Z', via: 'Upload', status: 'imported', statusText: 'Updated', note: '+1 operation · 2 examples changed' },
  { id: 'r3', protocol: 'EVENT', name: 'User signed-up API 0.1.1', at: '2026-11-03T09:00:00Z', via: 'Scheduled scan', status: 'warning', statusText: 'Imported with warning', note: '1 example skipped' },
  { id: 'r4', protocol: 'REST', name: 'Beer Catalog API 0.9', at: '2026-11-01T10:00:00Z', via: 'URL · scheduled', status: 'imported', statusText: 'Updated', note: '+1 example' },
];

const OPENAPI_OPS = [
  { method: 'GET', path: '/pastries', dispatcher: 'URI_PARAMS', exampleCount: 3 },
  { method: 'GET', path: '/pastries/{name}', dispatcher: 'URI_PARTS', exampleCount: 3 },
  { method: 'PATCH', path: '/pastries/{name}', dispatcher: 'JSON_BODY', exampleCount: 1 },
];

const ARAZZO_PREVIEW: Omit<ArazzoPreview, 'fileName'> = {
  title: 'Pastry workflows', version: '1.2.0', arazzoVersion: '1.1.0', overlay: 'ArazzoSources',
  workflows: [
    { workflowId: 'restock-pastry', name: 'Restock a pastry', steps: 3 },
    { workflowId: 'check-menu', name: 'Check the menu sizes', steps: 4, note: 'step dependsOn · 3 parallel steps' },
    { workflowId: 'order-pastry', name: 'Order a pastry', steps: 4 },
    { workflowId: 'track-order', name: 'Track an order', steps: 3, note: 'AsyncAPI · not runnable yet', blocked: true },
  ],
  sources: [
    { name: 'apiPastry', type: 'openapi', url: './apipastry-openapi.yaml', protocol: 'REST', service: 'API Pastry 2.0', operationsFound: '3 of 3 operations found' },
    { name: 'pastryOrders', type: 'asyncapi', url: './pastry-orders-0.1.0-asyncapi.yaml', protocol: 'EVENT', service: 'Pastry orders API 0.1.0', operationsFound: '1 of 1 operation found' },
    { name: 'pastryStock', type: 'openapi', url: './pastry-stock-openapi.yaml', protocol: 'REST', service: 'Pastry stock API 1.0', operationsFound: '2 of 2 operations found' },
  ],
};

const MOCK_BASE = 'https://microcks.bakery.dev';

const AGENT_PREVIEW: Omit<AgentPreview, 'fileName'> = {
  provider: 'Bakery platform', specVersion: '1.0',
  skills: [{ id: 'recommend-pastry', name: 'Recommend a pastry' }, { id: 'order-pastry', name: 'Order a pastry' }, { id: 'track-order', name: 'Track an order' }],
  interfaces: [
    { binding: 'JSONRPC', url: 'https://concierge.staging.acme.io/a2a/jsonrpc', preferred: true },
    { binding: 'HTTP+JSON', url: 'https://concierge.staging.acme.io/a2a/v1', preferred: false },
    { binding: 'GRPC', url: 'concierge.staging.acme.io:443 · a2a.v1.A2AService', preferred: false },
  ],
  mockInterfaces: [
    { binding: 'JSONRPC', url: 'http://microcks.local:8080/a2a/Pastry+concierge/1.0/jsonrpc' },
    { binding: 'HTTP+JSON', url: 'http://microcks.local:8080/a2a/Pastry+concierge/1.0/v1' },
    { binding: 'GRPC', url: 'microcks.local:9090 · a2a.v1.A2AService' },
  ],
  security: 'bakeryOAuth (OAuth2 client credentials)',
  capabilities: ['streaming', 'pushNotifications'],
  modes: ['text/plain', 'application/json'],
};

export function createInMemoryImportingAdapters(deps: InMemoryDeps = {}): ImportingAdapters {
  const clock = deps.clock ?? new FixedClock();
  const importers = new Map(seedImporters().map((i) => [i.id, i]));
  const removed = new Map<string, Importer>();
  const secrets = new Map(SEED_SECRETS.map((s) => [s.id, s]));
  const previews = new Map<string, ImportPreview>();
  let previewSeq = 0;

  const buildPreview = (source: ImportSource): ImportPreview => {
    previewSeq += 1;
    const previewId = `preview-${previewSeq}`;
    const fileName = source.kind === 'file' ? (source.files[0]?.name ?? 'artifact.yaml') : source.kind === 'url' ? (source.url.split('/').pop() ?? 'artifact.yaml') : (source.repository.split('/').pop() ?? 'artifact.yaml');
    const kind = detectArtifactKind(fileName);
    const base = { previewId, source, warnings: [] as string[], artifactName: fileName };
    let preview: ImportPreview;
    if (kind === 'arazzo') {
      preview = {
        ...base, services: [], formatLabel: 'Arazzo 1.1.0',
        origin: source.kind === 'git' ? 'Scanned from the repository: 1 Arazzo document found.' : 'Uploaded Arazzo document.',
        arazzo: { fileName, ...ARAZZO_PREVIEW },
      };
    } else if (kind === 'a2a') {
      preview = {
        ...base, formatLabel: 'A2A Agent Card · spec 1.0', origin: 'Example · concierge.staging.acme.io/.well-known/agent-card.json · one-off upload',
        services: [{
          name: 'Pastry concierge', version: '1.0', protocol: 'A2A', kind: 'a2a', exists: false,
          operations: AGENT_PREVIEW.skills.map((s) => ({ method: 'SKILL', path: s.id, dispatcher: 'metadata.skillId' })),
        }],
        agent: { fileName, ...AGENT_PREVIEW },
      };
    } else {
      const service: DetectedService = {
        name: source.kind === 'file' ? nameFromFile(fileName) || 'API Pastry' : 'API Pastry', version: '2.0', protocol: 'REST',
        kind: kind === 'unknown' ? 'openapi' : kind, exists: true, operations: OPENAPI_OPS,
      };
      preview = { ...base, services: [service], formatLabel: 'OpenAPI 3.1', exampleCount: 7, origin: source.kind === 'url' ? `Downloaded from ${source.url}` : 'Read from your computer.' };
    }
    previews.set(previewId, preview);
    return preview;
  };

  const gateway: ImportGateway = {
    analyze: (source) => after(() => buildPreview(source)),
    import: (previewId, options: ImportOptions) =>
      after<ImportResult>(() => {
        const preview = previews.get(previewId);
        if (!preview) throw new NotFoundError('Preview', previewId);
        if (preview.arazzo) {
          return {
            serviceId: 'pastry', name: preview.arazzo.title, version: preview.arazzo.version, operationCount: 0, outcome: 'arazzo', protocol: 'ARAZZO',
            arazzo: { documentId: 'pastry', workflows: preview.arazzo.workflows.length, steps: preview.arazzo.workflows.reduce((n, w) => n + w.steps, 0), sources: preview.arazzo.sources.length },
            importerName: preview.source.kind === 'git' ? (preview.source.name ?? 'Pastry workflows') : undefined,
          };
        }
        if (preview.agent) {
          return {
            serviceId: 'concierge', name: 'Pastry concierge', version: '1.0', operationCount: 3, outcome: 'a2a', protocol: 'A2A', samples: '0', mcp: false,
            mockLabel: 'Mock Agent Card', mockUrl: 'http://microcks.local:8080/a2a/Pastry+concierge/1.0/.well-known/agent-card.json',
            tryIt: "curl http://microcks.local:8080/a2a/Pastry+concierge/1.0/.well-known/agent-card.json",
            agent: { skills: 3, conversations: 0, transports: preview.agent.mockInterfaces.map((i) => i.binding) },
          };
        }
        const merged = options.role === 'secondary';
        const git = preview.source.kind === 'git';
        return {
          serviceId: 'pastry2', name: 'API Pastry', version: '2.0', operationCount: 3, protocol: 'REST', samples: '7',
          outcome: merged ? 'merged' : git ? 'importer-created' : 'imported', mcp: true, mockLabel: 'Mock base URL',
          mockUrl: `${MOCK_BASE}/rest/API+Pastry/2.0`, tryIt: `curl ${MOCK_BASE}/rest/API+Pastry/2.0/pastries/Millefeuille`,
        };
      }),
    createDirectApi: (input) =>
      after<ImportResult>(() => {
        const endpoint = directApiEndpoint(input, MOCK_BASE);
        return {
          serviceId: input.name.toLowerCase().replace(/\W+/g, '-'), name: input.name, version: input.version, operationCount: 1, outcome: 'direct',
          protocol: input.type === 'GENERIC_EVENT' ? 'EVENT' : 'REST', samples: input.payload?.trim() ? '1 payload' : 'dynamic', mcp: false,
          mockLabel: endpoint.label, mockUrl: endpoint.value, tryIt: endpoint.tryIt,
        };
      }),
  };

  const repo: ImporterRepository = {
    list: () => after(() => [...importers.values()]),
    get: (id) => after(() => importers.get(id)),
    setActive: (id, active) =>
      after(() => {
        const found = importers.get(id);
        if (!found) throw new NotFoundError('Importer', id);
        const next: Importer = { ...found, active };
        importers.set(id, next);
        return next;
      }),
    remove: (id) =>
      after(() => {
        const found = importers.get(id);
        if (found) removed.set(id, found);
        importers.delete(id);
      }),
    restore: (id) =>
      after(() => {
        const found = removed.get(id);
        if (!found) throw new NotFoundError('Importer', id);
        removed.delete(id);
        importers.set(id, found);
        return found;
      }),
    run: (id) => (listener) => {
      const inner = createSequenceStream([25, 50, 75, 100]);
      return inner((progress) => {
        if (progress === 100) {
          const found = importers.get(id);
          if (found) {
            const at = clock.now().toISOString();
            importers.set(id, {
              ...found, state: 'idle', lastSyncAt: at, health: found.health === 'failed' ? 'failed' : found.health,
              timeline: [{ kind: 'run', id: `run-${found.timeline.length + 1}`, at, trigger: 'Forced by MA', result: found.health === 'failed' ? 'failed' : 'imported', changes: [], note: found.health === 'failed' ? '401 Unauthorized' : 'no change' }, ...found.timeline],
            });
          }
        }
        listener(progress);
      });
    },
    diff: (id, from, to) =>
      after<ImporterDiff>(() => {
        if (!importers.has(id) && !removed.has(id)) throw new NotFoundError('Importer', id);
        const found = DIFFS[`${from}:${to}`];
        if (!found) throw new ValidationError(`No diff between ${from} and ${to}.`);
        return found;
      }),
  };

  const secretRepo: SecretRepository = {
    list: () => after(() => [...secrets.values()]),
    create: (input) =>
      after(() => {
        const created: SecretSummary = {
          id: `sec-${secrets.size + 1}`, name: input.name, kind: input.kind, description: input.description,
          masked: `••••••••${input.value.slice(-4).padStart(4, '•')}`, createdAt: clock.now().toISOString(),
        };
        secrets.set(created.id, created);
        return created;
      }),
    remove: (id) =>
      after(() => {
        secrets.delete(id);
      }),
  };

  const history: ImportHistory = { recent: (limit) => after(() => [...RECENT].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit)) };

  return { gateway, importers: repo, secrets: secretRepo, history, clock };
}
