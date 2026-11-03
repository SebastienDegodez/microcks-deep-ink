import type { DiffLine, ImportPreview, ImportResult, ImportSource, Importer } from '@/domain/importing';
import type { SecretSummary } from '@/domain/shared';
import { NotFoundError } from '@/application/shared';
import type { ImportGateway, ImporterRepository, SecretRepository } from '@/application/ports/importing';
import { SECRET_STAGING, after, createSequenceStream, type InMemoryDeps } from '../shared';

export interface ImportingAdapters {
  gateway: ImportGateway;
  importers: ImporterRepository;
  secrets: SecretRepository;
}

const SEED_SECRETS: SecretSummary[] = [
  { id: 'sec-1', name: SECRET_STAGING, kind: 'oauth2', description: 'Client credentials for the pastry staging API', masked: '••••••••3f2a', createdAt: '2026-09-12T08:00:00Z' },
  { id: 'sec-2', name: 'github-readonly', kind: 'token', description: 'Read-only token for the Git importers', masked: '••••••••c91d', createdAt: '2026-08-02T08:00:00Z' },
];

const SEED_IMPORTERS: Importer[] = [
  { id: 'pastry-github', name: 'pastry-workflows', source: { kind: 'git', repository: 'https://github.com/acme/pastry', path: 'contracts/' },
    kind: 'arazzo', active: true, state: 'idle', schedule: 'every 15 min', lastSyncAt: '2026-11-03T08:58:04Z', secretName: 'github-readonly',
    versions: [{ id: 'v1', label: '1.1.0', syncedAt: '2026-10-28T08:00:00Z', summary: 'Initial import' }, { id: 'v2', label: '1.2.0', syncedAt: '2026-11-03T08:58:04Z', summary: 'Added check-menu' }] },
  { id: 'beer-catalog', name: 'beer-catalog', source: { kind: 'url', url: 'https://beer.acme.io/openapi.yaml' },
    kind: 'openapi', active: true, state: 'running', schedule: 'hourly', lastSyncAt: '2026-11-03T08:10:04Z',
    versions: [{ id: 'v1', label: '0.9', syncedAt: '2026-10-13T08:00:00Z', summary: 'Initial import' }] },
];

export function createInMemoryImportingAdapters(_deps: InMemoryDeps = {}): ImportingAdapters {
  const importers = new Map(SEED_IMPORTERS.map((i) => [i.id, { ...i }]));
  const removed = new Map<string, Importer>();
  const secrets = new Map(SEED_SECRETS.map((s) => [s.id, s]));

  const nameOf = (source: ImportSource) =>
    source.kind === 'file' ? (source.files[0]?.name ?? 'contract').replace(/\.[a-z]+$/i, '') : source.kind === 'url' ? source.url : source.repository;

  const gateway: ImportGateway = {
    analyze: (source) =>
      after<ImportPreview>(() => ({
        previewId: 'preview-1',
        source,
        services: [{
          name: nameOf(source) || 'API Pastry', version: '2.0', protocol: 'REST', kind: 'openapi', exists: false,
          operations: [{ method: 'GET', path: '/pastries' }, { method: 'GET', path: '/pastries/{name}' }, { method: 'PATCH', path: '/pastries/{name}' }],
        }],
        warnings: [],
      })),
    import: () => after<ImportResult>({ serviceId: 'pastry2', name: 'API Pastry', version: '2.0', operationCount: 3 }),
    createDirectApi: (input) =>
      after<ImportResult>({ serviceId: input.name.toLowerCase().replace(/\W+/g, '-'), name: input.name, version: input.version, operationCount: 1 }),
  };

  const repo: ImporterRepository = {
    list: () => after(() => [...importers.values()]),
    get: (id) => after(() => importers.get(id)),
    setActive: (id, active) =>
      after(() => {
        const found = importers.get(id);
        if (!found) throw new NotFoundError('Importer', id);
        const next = { ...found, active };
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
    run: () => createSequenceStream([25, 50, 75, 100]),
    diff: (_id, from, to) =>
      after(() => {
        const lines: DiffLine[] = [
          { kind: 'context', text: 'paths:' },
          { kind: 'removed', text: '  /pastries/{name}/stock:' },
          { kind: 'added', text: '  /pastries/{name}:' },
          { kind: 'added', text: '    patch:' },
        ];
        return { from, to, lines };
      }),
  };

  const secretRepo: SecretRepository = {
    list: () => after(() => [...secrets.values()]),
    create: (input) =>
      after(() => {
        const created: SecretSummary = {
          id: `sec-${secrets.size + 1}`, name: input.name, kind: input.kind, description: input.description,
          masked: `••••••••${input.value.slice(-4).padStart(4, '•')}`, createdAt: '2026-11-03T09:10:04Z',
        };
        secrets.set(created.id, created);
        return created;
      }),
    remove: (id) =>
      after(() => {
        secrets.delete(id);
      }),
  };

  return { gateway, importers: repo, secrets: secretRepo };
}
