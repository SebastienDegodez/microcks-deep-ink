// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { FixedClock } from '@/infrastructure/in-memory/shared';
import { createInMemoryImportingAdapters } from '@/infrastructure/in-memory/importing';
import { seedImporters } from '@/infrastructure/in-memory/importing/seed/importers';
import { toMicrocksImportJob, toMicrocksSecret } from '@/infrastructure/msw/handlers/importing';
import { toImporter, toMicrocksSecretRequest, toSecretInput, toSecretSummary } from './mapping';
import type { MicrocksImportJob, MicrocksSecret } from './microcks';

/** A Microcks `ImportJob` as Microcks itself serves it (no demo extension). */
const PLAIN: MicrocksImportJob = {
  id: '5be58fb51ed744d1b87481bd', name: 'Petstore API', repositoryUrl: 'https://acme.io/contracts/petstore-openapi.yaml',
  repositoryDisableSSLValidation: true, createdDate: Date.parse('2026-10-01T08:00:00Z'), lastImportDate: Date.parse('2026-11-03T08:00:00Z'),
  lastImportError: '401 Unauthorized', active: false, mainArtifact: false,
  serviceRefs: [{ serviceId: 'petstore', name: 'Petstore API', version: '1.0' }],
  metadata: { createdOn: 0, lastUpdate: 0, labels: { domain: 'pets', status: 'GA' } },
  secretRef: { secretId: 's1', name: 'github-contracts' },
};

const roundTrip = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

describe('Microcks ImportJob -> importer', () => {
  it('maps a plain Microcks job: URL source, role, SSL, labels, dates, produced services and the last error', () => {
    const importer = toImporter(PLAIN);
    expect(importer).toMatchObject({
      id: '5be58fb51ed744d1b87481bd', name: 'Petstore API', url: PLAIN.repositoryUrl, kind: 'openapi', origin: 'url',
      source: { kind: 'url', url: PLAIN.repositoryUrl, secretName: 'github-contracts' }, secretName: 'github-contracts',
      active: false, role: 'secondary', sslValidation: false, state: 'failed', health: 'failed', schedule: 'every hour',
      createdAt: '2026-10-01T08:00:00.000Z', lastSyncAt: '2026-11-03T08:00:00.000Z',
      labels: [{ key: 'domain', value: 'pets' }, { key: 'status', value: 'GA' }],
      produces: [{ protocol: 'REST', name: 'Petstore API', version: '1.0', id: 'petstore' }],
      error: { message: '401 Unauthorized', since: '2026-11-03T08:00:00.000Z' },
      versions: [], timeline: [],
    });
  });

  it('defaults a job without error, schedule data or optional fields to a healthy primary artifact', () => {
    const importer = toImporter({ name: 'Bare', repositoryUrl: 'https://acme.io/bare.proto' });
    expect(importer).toMatchObject({ id: 'Bare', kind: 'grpc', active: true, role: 'primary', sslValidation: true, state: 'idle', health: 'imported', labels: [], produces: [] });
    expect(importer).not.toHaveProperty('lastSyncAt');
    expect(importer).not.toHaveProperty('error');
  });

  it('gives back every seeded importer through the MSW serialisation and JSON', () => {
    for (const seed of seedImporters()) expect(toImporter(roundTrip(toMicrocksImportJob(seed)))).toEqual(seed);
  });

  it('serialises a protocol-less service ref to an empty serviceId and back', () => {
    const [seed] = seedImporters();
    const job = toMicrocksImportJob({ ...seed!, produces: [{ protocol: 'EVENT', name: 'Orders', version: '0.1' }] });
    expect(job.serviceRefs).toEqual([{ serviceId: '', name: 'Orders', version: '0.1' }]);
    expect(toImporter(job).produces).toEqual([{ protocol: 'EVENT', name: 'Orders', version: '0.1' }]);
  });
});

describe('Microcks Secret <-> secret summary', () => {
  it('reads the kind of a plain Microcks secret from its credentials, and never maps a value', () => {
    const plain = (extra: Partial<MicrocksSecret>) => toSecretSummary({ id: 'x', name: 'n', description: 'd', ...extra });
    expect(plain({ token: 't', tokenHeader: 'PRIVATE-TOKEN' })).toEqual({ id: 'x', name: 'n', kind: 'token', description: 'd', masked: '••••••••', createdAt: '' });
    expect(plain({ username: 'u', password: 'p' }).kind).toBe('basic');
    expect(plain({ caCertPem: '-----BEGIN CERTIFICATE-----' }).kind).toBe('ca');
  });

  it('gives back every seeded secret through the MSW serialisation and JSON', async () => {
    const seeds = await createInMemoryImportingAdapters({ clock: new FixedClock() }).secrets.list();
    for (const seed of seeds) expect(toSecretSummary(roundTrip(toMicrocksSecret(seed)))).toEqual(seed);
  });

  it('puts the value in the credential field of its kind, and leaves an empty value out', () => {
    expect(toMicrocksSecretRequest('gh', { kind: 'token', value: 'abcd', description: 'd', detail: 'header X' })).toEqual({
      name: 'gh', description: 'd', token: 'abcd', demo: { kind: 'token', detail: 'header X' },
    });
    expect(toMicrocksSecretRequest('b', { kind: 'basic', value: 'pw' })).toMatchObject({ password: 'pw' });
    expect(toMicrocksSecretRequest('o', { kind: 'oauth2', value: 'cs' })).toMatchObject({ password: 'cs' });
    expect(toMicrocksSecretRequest('c', { kind: 'ca', value: 'pem' })).toMatchObject({ caCertPem: 'pem' });
    expect(toMicrocksSecretRequest('gh', { kind: 'token', value: '' })).toEqual({ name: 'gh', demo: { kind: 'token' } });
  });

  it('reads a secret request back into the input of the port', () => {
    const input = { name: 'ca', kind: 'ca' as const, value: 'pem', description: 'chain', detail: 'PEM' };
    expect(toSecretInput(toMicrocksSecretRequest(input.name, input))).toEqual(input);
    expect(toSecretInput({ name: 'plain', username: 'u', password: 'p' })).toEqual({ name: 'plain', kind: 'basic', value: 'p' });
  });
});
