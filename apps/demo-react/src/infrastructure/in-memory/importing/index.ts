import type {
  AgentPreview, ArazzoPreview, DetectedService, ImportOptions, ImportPreview, ImportResult, ImportSource, Importer, ImporterDiff, RecentImport,
} from '@/domain/importing';
import { detectArtifactKind, directApiEndpoint } from '@/domain/importing';
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

/** "Recent sources" of the Import screen, as on the prototype (demo clock 2026-11-03T09:10:04Z). */
const RECENT: RecentImport[] = [
  { id: 'r1', protocol: 'REST', name: 'API Pastry 2.0', at: '2026-11-03T07:10:00Z', via: 'Upload', status: 'imported', statusText: 'Imported', note: '3 Operations · 7 Examples' },
  { id: 'r2', protocol: 'EVENT', name: 'Pastry orders API 0.1.0', at: '2026-11-03T04:10:00Z', via: 'Git repository · scheduled', status: 'imported', statusText: 'Imported', note: 'AsyncAPI · SUBSCRIBE pastry/orders' },
  { id: 'r3', protocol: 'gRPC', name: 'HelloService v1', at: '2026-11-02T10:00:00Z', via: 'URL', status: 'warning', statusText: 'Missing Examples', note: 'Protobuf only: add a secondary Artifact (Postman, APIExamples) for the responses.' },
];


const OPENAPI_OPS = [
  { method: 'GET', path: '/pastries', dispatcher: 'URI_PARAMS', exampleCount: 3 },
  { method: 'GET', path: '/pastries/{name}', dispatcher: 'URI_PARTS', exampleCount: 3 },
  { method: 'PATCH', path: '/pastries/{name}', dispatcher: 'URI_PARTS', exampleCount: 1 },
];

const ARAZZO_PREVIEW: Omit<ArazzoPreview, 'fileName'> = {
  title: 'Pastry workflows', version: '1.2.0', arazzoVersion: '1.1.0', overlay: 'ArazzoSources',
  workflows: [
    { workflowId: 'restock-pastry', name: 'Restock a pastry', steps: 4 },
    { workflowId: 'order-pastry', name: 'Order a pastry', steps: 3, note: 'AsyncAPI · not runnable yet', blocked: true },
    { workflowId: 'compare-prices', name: 'Compare v1 / v2 prices', steps: 3 },
    { workflowId: 'check-menu', name: 'Check the menu sizes', steps: 4, note: 'step dependsOn · 3 parallel steps' },
  ],
  sources: [
    { name: 'apiPastry', type: 'openapi', url: './apipastry-2.0-openapi.yaml', protocol: 'REST', service: 'API Pastry 2.0', operationsFound: '3 of 3 found' },
    { name: 'apiPastryV1', type: 'openapi', url: './apipastry-1.0-openapi.yaml', protocol: 'REST', service: 'API Pastry 1.0', operationsFound: '1 of 1 found' },
    { name: 'pastryOrders', type: 'asyncapi', url: './pastry-orders-0.1.0-asyncapi.yaml', protocol: 'EVENT', service: 'Pastry orders API 0.1.0', operationsFound: '2 of 2 found' },
  ],
};

const MOCK_BASE = 'http://microcks.local:8080';

const AGENT_PREVIEW: Omit<AgentPreview, 'fileName'> = {
  provider: 'Bakery platform', specVersion: '1.0',
  skills: [
    { id: 'recommend-pastry', name: 'Recommend a pastry', modes: 'text in · application/json out', note: 'artifact recommendation' },
    { id: 'order-pastry', name: 'Order a pastry', modes: 'text in · application/json out', note: 'multi-turn · input-required' },
    { id: 'track-order', name: 'Track an order', modes: 'text in · text/plain out', note: 'streaming · artifact chunks' },
  ],
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
  capabilities: [{ name: 'streaming', on: true }, { name: 'pushNotifications', on: true }, { name: 'extendedAgentCard', on: false }],
  modes: ['text/plain', 'application/json'],
};

export function createInMemoryImportingAdapters(deps: InMemoryDeps = {}): ImportingAdapters {
  const clock = deps.clock ?? new FixedClock();
  const importers = new Map(seedImporters().map((i) => [i.id, i]));
  const removed = new Map<string, Importer>();
  const secrets = new Map(SEED_SECRETS.map((s) => [s.id, s]));
  const previews = new Map<string, ImportPreview>();
  const recent: RecentImport[] = [...RECENT];
  /** Records a done import at the top of "Recent sources": it replaces the entry of the same API, or pushes out the oldest one. */
  const record = (entry: Omit<RecentImport, 'id' | 'at'>) => {
    const at = clock.now().toISOString();
    const same = recent.findIndex((r) => r.name === entry.name);
    if (same >= 0) recent.splice(same, 1);
    else recent.pop();
    recent.unshift({ ...entry, id: `r-${at}-${recent.length}`, at });
  };
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
        origin: source.kind === 'git' ? 'Git repository · scheduled re-scan · external references resolved' : source.kind === 'file' && source.sample ? 'Example · bakery-platform/contracts · arazzo/pastry-workflows.arazzo.yaml' : 'Dropped from your machine · one-off import',
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
      // The demo reads every OpenAPI artifact as the API Pastry sample (the real Microcks reads the content).
      const service: DetectedService = {
        name: 'API Pastry', version: '2.0', protocol: 'REST',
        kind: kind === 'unknown' ? 'openapi' : kind, exists: true, operations: OPENAPI_OPS,
      };
      const origin = source.kind === 'url' ? source.url
        : source.kind === 'git' ? 'Git repository · scheduled re-scan · external references resolved'
        : source.sample ? 'Microcks sample · samples/APIPastry-openapi.yaml' : 'Dropped from your machine · one-off import';
      preview = { ...base, services: [service], formatLabel: 'OpenAPI 3.1', exampleCount: 7, origin };
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
        const src = preview.source;
        if (preview.arazzo) {
          const { workflows, sources } = preview.arazzo;
          const steps = workflows.reduce((n, w) => n + w.steps, 0);
          record({ protocol: 'ARAZZO', name: `${preview.arazzo.title} ${preview.arazzo.version}`, via: 'Upload', status: 'imported', statusText: 'Imported', note: `${workflows.length} workflows · ${steps} steps · ${sources.length} source descriptions linked` });
          return {
            serviceId: 'pastry', name: preview.arazzo.title, version: preview.arazzo.version, operationCount: 0, outcome: 'arazzo', protocol: 'ARAZZO',
            arazzo: { documentId: 'pastry', workflows: workflows.length, steps, sources: sources.length },
            importerName: src.kind === 'git' ? (src.name ?? 'Pastry workflows') : undefined,
            createdSource: { name: preview.arazzo.title, detail: `${preview.arazzo.fileName} · ${workflows.length} workflows`, origin: 'Upload', schedule: 'no schedule · one-off' },
          };
        }
        if (preview.agent) {
          const { skills, interfaces, mockInterfaces } = preview.agent;
          record({ protocol: 'A2A', name: 'Pastry concierge 1.0', via: 'Upload', status: 'warning', statusText: 'No conversations', note: `${skills.length} skills · ${interfaces.length} interfaces · add an APIExamples secondary artifact` });
          return {
            serviceId: 'concierge', name: 'Pastry concierge', version: '1.0', operationCount: skills.length, outcome: 'a2a', protocol: 'A2A', samples: '0', mcp: false,
            agent: { skills: skills.length, conversations: 0, transports: mockInterfaces.map((i) => i.binding) },
            endpoints: mockInterfaces,
            createdSource: { name: 'Pastry concierge · Agent Card', detail: `${preview.agent.fileName} · Pastry concierge 1.0`, origin: 'Upload', schedule: 'no schedule · one-off' },
          };
        }
        const merged = options.role === 'secondary';
        const git = src.kind === 'git';
        const url = src.kind === 'url';
        const fileName = preview.artifactName ?? 'apipastry-openapi.yaml';
        record({ protocol: 'REST', name: 'API Pastry 2.0', via: git ? 'Git repository · scheduled' : url ? 'URL · scheduled' : 'Upload', status: 'imported', statusText: 'Imported', note: '3 Operations · 7 Examples' });
        const createdSource = git
          ? { name: src.name ?? 'API Pastry — main', detail: src.repository, origin: 'Git', schedule: 'scheduled · re-scanned every hour' }
          : url
            ? { name: 'API Pastry 2.0 · OpenAPI', detail: src.url, origin: 'URL', schedule: 'scheduled · global scan' }
            : { name: 'API Pastry 2.0 · OpenAPI', detail: `${fileName} · ${merged ? 'secondary' : 'primary'}`, origin: 'Upload', schedule: 'no schedule · one-off' };
        const mockUrl = `${MOCK_BASE}/rest/API+Pastry/2.0`;
        return {
          serviceId: 'pastry2', name: 'API Pastry', version: '2.0', operationCount: 3, protocol: 'REST', samples: '7',
          outcome: merged ? 'merged' : git ? 'importer-created' : 'imported', mcp: true, mockLabel: 'Mock base URL',
          mockUrl, tryIt: `curl -H "Accept: application/json" \\\n  ${mockUrl}/pastries/Millefeuille`,
          importerName: git ? (src.name ?? 'API Pastry — main') : undefined,
          createdSource,
        };
      }),
    createDirectApi: (input) =>
      after<ImportResult>(() => {
        const endpoint = directApiEndpoint(input, MOCK_BASE);
        const event = input.type === 'GENERIC_EVENT';
        const resource = input.resource.trim();
        record({
          protocol: event ? 'EVENT' : 'DIRECT', name: `${input.name.trim()} ${input.version.trim()}`, via: 'Direct API', status: 'created', statusText: 'Created',
          note: event ? 'Generated AsyncAPI · 1 Operation' : `Generated OpenAPI · CRUD on /${resource}`,
        });
        return {
          serviceId: input.name.toLowerCase().replace(/\W+/g, '-'), name: input.name.trim(), version: input.version.trim(), operationCount: 1, outcome: 'direct',
          protocol: event ? 'EVENT' : 'DIRECT', samples: event ? '1 payload' : 'dynamic', mcp: false, resource,
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

  const history: ImportHistory = { recent: (limit) => after(() => recent.slice(0, limit)) };

  return { gateway, importers: repo, secrets: secretRepo, history, clock };
}
