import { describe, expect, it } from 'vitest';
import { createGovernUseCases } from '@/application/govern';
import type { SecretRepository } from '@/application/ports/importing';
import { NotFoundError, ValidationError } from '@/application/shared';
import type { SecretSummary } from '@/domain/shared';
import { createInMemoryGovernAdapters } from './index';

function setup() {
  const store: SecretSummary[] = [{ id: 's1', name: 'pastry-staging-oauth', kind: 'oauth2', masked: '••••', createdAt: '2026-10-30T00:00:00Z' }];
  const secrets: SecretRepository = {
    list: async () => [...store],
    create: async (input) => {
      const created = { id: `s${store.length + 1}`, name: input.name, kind: input.kind, description: input.description, masked: '••••••••', createdAt: '2026-11-03T09:10:04Z' };
      store.push(created);
      return created;
    },
    remove: async (id) => {
      store.splice(store.findIndex((s) => s.id === id), 1);
    },
  };
  return createGovernUseCases({ ...createInMemoryGovernAdapters(), secrets });
}

describe('hub use cases', () => {
  it('lists the 8 packages, searches them and groups the categories', async () => {
    const uc = setup();
    expect(await uc.listPackages()).toHaveLength(8);
    expect((await uc.listPackages({ query: 'sim swap' })).map((p) => p.id)).toEqual(['telco']);
    expect((await uc.listPackages({ category: 'Samples' })).map((p) => p.id)).toEqual(['pastry', 'multi-samples', 'weather']);
    expect((await uc.listCategories()).map((c) => c.name)).toEqual(['Samples', 'Banking', 'Payments', 'Telco', 'Events', 'Retail']);
  });

  it('knows which APIs are already in the catalogue, and installs once', async () => {
    const uc = setup();
    const pastry = await uc.getPackage('pastry');
    expect(pastry.installed).toBe(true);
    expect(pastry.apis?.map((a) => a.inCatalogue)).toEqual([['2.0', '1.0'], ['0.1.0']]);
    await expect(uc.install('pastry', { version: '2.0', mode: 'sync', role: 'user' })).rejects.toBeInstanceOf(ValidationError);
    const progress: number[] = [];
    const installed = await uc.install('banking', { version: '1.2.0', mode: 'sync', role: 'user', artifactRole: 'main' }, (p) => progress.push(p));
    expect(installed.installed).toBe(true);
    expect(progress).toEqual([0, 100]);
    await expect(uc.getPackage('nope')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('admin use cases', () => {
  it('changes a role and reports the groups of each user', async () => {
    const uc = setup();
    const users = await uc.listUsers();
    expect(users.find((u) => u.id === 'tom.keller')?.groups).toEqual(['pastry', 'pets']);
    expect((await uc.setRole('lea.martin', 'manager')).role).toBe('manager');
    expect((await uc.listUsers()).find((u) => u.id === 'lea.martin')?.role).toBe('manager');
  });

  it('approves a request into the group and saves members', async () => {
    const uc = setup();
    expect((await uc.listGroups()).find((g) => g.id === 'beer')?.pendingRequests).toBe(1);
    await uc.approveRequest('req-1');
    const beer = (await uc.listGroups()).find((g) => g.id === 'beer');
    expect(beer).toMatchObject({ members: ['clara.nguyen'], pendingRequests: 0 });
    expect((await uc.saveMembers('beer', [])).members).toEqual([]);
    await expect(uc.approveRequest('req-1')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('creates and deletes secrets with validation', async () => {
    const uc = setup();
    await expect(uc.createSecret({ name: 'Bad Name', kind: 'token', value: 'x' })).rejects.toBeInstanceOf(ValidationError);
    await expect(uc.createSecret({ name: 'pastry-staging-oauth', kind: 'token', value: 'x' })).rejects.toThrow('already exists');
    await uc.createSecret({ name: 'gitlab-bakery', kind: 'token', value: 'glpat-1234' });
    expect((await uc.listSecrets()).map((s) => s.name)).toEqual(['pastry-staging-oauth', 'gitlab-bakery']);
    await uc.deleteSecret('s2');
    expect(await uc.listSecrets()).toHaveLength(1);
  });

  it('exports a snapshot of the chosen services and toggles flags', async () => {
    const uc = setup();
    const snapshot = await uc.exportSnapshot(['pastry2', 'orders']);
    expect(snapshot.operations).toBe(4);
    expect(snapshot.sizeKb).toBe(28);
    expect((await uc.listSnapshotServices()).map((x) => x.id)).toEqual(['pastry2', 'pastry1', 'orders', 'usersignedup', 'hellogrpc', 'movie', 'hellosoap', 'petstore', 'beer', 'rocks']);
    expect(JSON.parse(snapshot.json).services.map((s: { id: string }) => s.id)).toEqual(['pastry2', 'orders']);
    expect((await uc.previewSnapshotImport('x.json')).map((p) => p.kind)).toEqual(['replace', 'replace', 'new']);
    expect(await uc.importSnapshot('x.json')).toEqual({ created: 1, replaced: 2 });
    expect((await uc.setFlag('filter', true)).enabled).toBe(true);
    expect((await uc.listFlags()).filter((f) => f.enabled)).toHaveLength(7);
  });
});
