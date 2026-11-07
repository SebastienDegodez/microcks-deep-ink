import { describe, expect, it } from 'vitest';
import type { ImportingPorts } from '@/application/importing';
import { expectNotFound, expectSilentAfterUnsubscribe, expectValidationError, nextEmission, takeEmissions, useAdapters, useFakeTimers, type MakeAdapters } from './support.contract';

/** The ports the importing feature owns (the clock is a dependency, not a port to test). */
export type ImportingOwnPorts = Pick<ImportingPorts, 'gateway' | 'importers' | 'secrets' | 'history'>;

const OPENAPI_FILE = { kind: 'file' as const, files: [{ name: 'apipastry-openapi.yaml', sizeBytes: 5000 }] };
const NOW = '2026-11-03T09:10:04.000Z';
const TICK_MS = 1200;

/** Contract of `ImportGateway`, `ImporterRepository`, `SecretRepository` and `ImportHistory` over the seeded sources. */
export function describeImportingPortContract(name: string, makeAdapters: MakeAdapters<ImportingOwnPorts>): void {
  describe(`importing ports contract · ${name}`, () => {
    const adapters = useAdapters(makeAdapters);
    const gateway = () => adapters().gateway;
    const importers = () => adapters().importers;
    const secrets = () => adapters().secrets;
    const history = () => adapters().history;

    describe('ImportGateway.analyze', () => {
      it('reads an OpenAPI file as API Pastry 2.0 (3 operations, 7 examples) without importing it', async () => {
        const preview = await gateway().analyze(OPENAPI_FILE);
        expect(preview).toMatchObject({ formatLabel: 'OpenAPI 3.1', exampleCount: 7, artifactName: 'apipastry-openapi.yaml', source: OPENAPI_FILE });
        expect(preview.services.map((s) => [s.name, s.version, s.operations.length])).toEqual([['API Pastry', '2.0', 3]]);
        expect((await history().recent(3)).map((r) => r.id)).toEqual(['r1', 'r2', 'r3']);
      });

      it('gives every analysis its own preview id', async () => {
        const first = await gateway().analyze(OPENAPI_FILE);
        const second = await gateway().analyze(OPENAPI_FILE);
        expect(second.previewId).not.toBe(first.previewId);
      });

      it('reads an Arazzo document: 4 workflows, 14 steps, 3 sources', async () => {
        const preview = await gateway().analyze({ kind: 'file', files: [{ name: 'pastry-workflows.arazzo.yaml', sizeBytes: 9000 }] });
        expect(preview.services).toEqual([]);
        expect(preview.arazzo?.workflows.reduce((n, w) => n + w.steps, 0)).toBe(14);
        expect(preview.arazzo?.sources).toHaveLength(3);
      });

      it('reads an A2A Agent Card as the Pastry concierge with its 3 skills', async () => {
        const preview = await gateway().analyze({ kind: 'file', files: [{ name: 'agent-card.json', sizeBytes: 3200 }] });
        expect(preview.services.map((s) => [s.name, s.protocol])).toEqual([['Pastry concierge', 'A2A']]);
        expect(preview.agent?.skills).toHaveLength(3);
      });
    });

    describe('ImportGateway.import', () => {
      it('imports a primary artifact and records it at the top of the recent sources', async () => {
        const preview = await gateway().analyze(OPENAPI_FILE);
        const done = await gateway().import(preview.previewId, { role: 'primary' });
        expect(done).toMatchObject({ serviceId: 'pastry2', outcome: 'imported', operationCount: 3, mcp: true });
        const recent = await history().recent(3);
        expect(recent[0]).toMatchObject({ name: 'API Pastry 2.0', at: NOW, via: 'Upload' });
        expect(recent.map((r) => r.name)).toEqual(['API Pastry 2.0', 'Pastry orders API 0.1.0', 'HelloService v1']);
      });

      it('merges a secondary artifact, and creates an importer for a Git source', async () => {
        const secondary = await gateway().import((await gateway().analyze(OPENAPI_FILE)).previewId, { role: 'secondary' });
        expect(secondary.outcome).toBe('merged');
        const git = await gateway().analyze({ kind: 'git', repository: 'https://github.com/acme/contracts', name: 'API Pastry — main' });
        expect(await gateway().import(git.previewId, { role: 'primary' })).toMatchObject({ outcome: 'importer-created', importerName: 'API Pastry — main' });
      });

      it('fails with NotFoundError for an unknown preview', async () => {
        await expectNotFound(gateway().import('preview-nope', { role: 'primary' }));
      });
    });

    describe('ImportGateway.createDirectApi', () => {
      it('creates a REST direct API with a CRUD mock, recorded in the recent sources', async () => {
        const done = await gateway().createDirectApi({ type: 'REST', name: 'Croissant API', version: '1.0', resource: 'croissants' });
        expect(done).toMatchObject({ serviceId: 'croissant-api', outcome: 'direct', protocol: 'DIRECT', resource: 'croissants', mcp: true });
        expect((await history().recent(1))[0]).toMatchObject({ name: 'Croissant API 1.0', status: 'created' });
      });

      it('creates a generic event API', async () => {
        const done = await gateway().createDirectApi({ type: 'GENERIC_EVENT', name: 'Oven events', version: '0.1', resource: 'oven', payload: '{}' });
        expect(done).toMatchObject({ outcome: 'direct', protocol: 'EVENT', mcp: false });
      });
    });

    describe('ImportHistory.recent', () => {
      it('returns the seeded recent sources, newest first, limited', async () => {
        const recent = await history().recent(2);
        expect(recent.map((r) => r.id)).toEqual(['r1', 'r2']);
        expect(recent[0]!.at > recent[1]!.at).toBe(true);
      });
    });

    describe('ImporterRepository list / get / setActive', () => {
      it('lists the 12 importers in seed order', async () => {
        const list = await importers().list();
        expect(list.map((i) => i.id)).toEqual([
          'pastry-openapi', 'pastry-postman', 'pastry-workflows', 'pastry-workflows-sources', 'pastry-orders', 'user-signedup',
          'hello-grpc', 'hello-soap', 'movie-graph', 'beer-catalog', 'upload-agent-card', 'upload-postman',
        ]);
      });

      it('returns an importer by id, or undefined', async () => {
        expect(await importers().get('pastry-orders')).toMatchObject({ id: 'pastry-orders', health: 'failed', state: 'failed' });
        expect(await importers().get('nope')).toBeUndefined();
      });

      it('pauses an importer, visible on the next read', async () => {
        expect(await importers().setActive('pastry-openapi', false)).toMatchObject({ id: 'pastry-openapi', active: false });
        expect((await importers().get('pastry-openapi'))?.active).toBe(false);
        await expectNotFound(importers().setActive('nope', true));
      });
    });

    describe('ImporterRepository remove / restore', () => {
      it('removes an importer and restores it at the same position (Undo)', async () => {
        const before = (await importers().list()).map((i) => i.id);
        await importers().remove('hello-grpc');
        expect((await importers().list()).map((i) => i.id)).not.toContain('hello-grpc');
        expect(await importers().get('hello-grpc')).toBeUndefined();
        expect(await importers().restore('hello-grpc')).toMatchObject({ id: 'hello-grpc' });
        expect((await importers().list()).map((i) => i.id)).toEqual(before);
      });

      it('fails with NotFoundError when restoring an importer that was not removed', async () => {
        await expectNotFound(importers().restore('hello-grpc'));
      });
    });

    describe('ImporterRepository.diff', () => {
      it('returns the diff between two scanned versions', async () => {
        const diff = await importers().diff('pastry-openapi', '3c9e1d0', 'a41f9c2');
        expect(diff).toMatchObject({ from: '3c9e1d0', to: 'a41f9c2' });
      });

      it('fails with ValidationError for unknown versions and NotFoundError for an unknown importer', async () => {
        await expectValidationError(importers().diff('pastry-openapi', 'aaaaaaa', 'bbbbbbb'));
        await expectNotFound(importers().diff('nope', '3c9e1d0', 'a41f9c2'));
      });
    });

    describe('ImporterRepository.run', () => {
      useFakeTimers();

      it('emits the progress 25, 50, 75, 100 in order, then records the sync in the timeline', async () => {
        const before = (await importers().get('pastry-openapi'))!;
        const { values, unsubscribe } = await takeEmissions(importers().run('pastry-openapi'), (progress) => progress.includes(100));
        expect(values).toEqual([25, 50, 75, 100]);
        unsubscribe();
        const after = await importers().get('pastry-openapi');
        expect(after).toMatchObject({ state: 'idle', lastSyncAt: NOW });
        expect(after?.timeline).toHaveLength(before.timeline.length + 1);
        expect(after?.timeline[0]).toMatchObject({ kind: 'run', trigger: 'Forced by MA', result: 'imported' });
      });

      it('stops emitting once unsubscribed', async () => {
        const { value, values, unsubscribe } = await nextEmission(importers().run('pastry-openapi'));
        expect(value).toBe(25);
        await expectSilentAfterUnsubscribe(values, unsubscribe, 3 * TICK_MS);
      });
    });

    describe('SecretRepository', () => {
      it('lists the 5 secrets in display order with the number of importers using each', async () => {
        const list = await secrets().list();
        expect(list.map((s) => s.id)).toEqual(['sec-4', 'sec-3', 'sec-5', 'sec-1', 'sec-2']);
        expect(list.every((s) => typeof s.usedBy === 'number')).toBe(true);
      });

      it('creates a secret first in the list with a masked value, never the value itself', async () => {
        const created = await secrets().create({ name: 'bitbucket-ro', kind: 'token', value: 'secret-value-9f1c', description: 'Read-only' });
        expect(created).toMatchObject({ id: 'sec-6', name: 'bitbucket-ro', masked: '••••••••9f1c', createdAt: NOW, usedBy: 0 });
        expect(JSON.stringify(await secrets().list())).not.toContain('secret-value-9f1c');
        expect((await secrets().list())[0]?.id).toBe('sec-6');
      });

      it('updates a secret: an empty value keeps the stored one', async () => {
        const before = (await secrets().list()).find((s) => s.id === 'sec-4')!;
        const updated = await secrets().update('sec-4', { kind: 'token', description: 'Rotated', value: '' });
        expect(updated).toMatchObject({ id: 'sec-4', name: before.name, description: 'Rotated', masked: before.masked, updatedAt: NOW });
        expect((await secrets().update('sec-4', { kind: 'token', value: 'new-token-abcd' })).masked).toBe('••••••••abcd');
        await expectNotFound(secrets().update('nope', { kind: 'token', value: '' }));
      });

      it('removes a secret', async () => {
        await secrets().remove('sec-5');
        expect((await secrets().list()).map((s) => s.id)).toEqual(['sec-4', 'sec-3', 'sec-1', 'sec-2']);
      });
    });
  });
}
