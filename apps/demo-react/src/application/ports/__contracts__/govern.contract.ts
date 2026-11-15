import { describe, expect, it } from 'vitest';
import type { GovernPorts } from '@microcks/demo-core/application/govern';
import { expectNotFound, useAdapters, type MakeAdapters } from './support.contract';

/** The ports the govern feature owns (secrets belong to the importing feature). */
export type GovernOwnPorts = Pick<GovernPorts, 'hub' | 'admin'>;

/** Contract of `HubRepository` and `AdminRepository` over the seeded Hub (8 packages) and admin data. */
export function describeGovernPortContract(name: string, makeAdapters: MakeAdapters<GovernOwnPorts>): void {
  describe(`govern ports contract · ${name}`, () => {
    const adapters = useAdapters(makeAdapters);
    const hub = () => adapters().hub;
    const admin = () => adapters().admin;

    describe('HubRepository.list / categories / get', () => {
      it('lists the 8 packages in seed order', async () => {
        expect((await hub().list()).map((p) => p.id)).toEqual(['banking', 'payments', 'telco', 'kafka-events', 'pastry', 'multi-samples', 'weather', 'retail']);
      });

      it('searches names, descriptions and APIs (case-insensitive) and filters by category', async () => {
        expect((await hub().list({ query: 'SIM swap' })).map((p) => p.id)).toEqual(['telco']);
        expect((await hub().list({ category: 'Samples' })).map((p) => p.id)).toEqual(['pastry', 'multi-samples', 'weather']);
        expect(await hub().list({ query: 'no-such-package' })).toEqual([]);
      });

      it('counts the packages per category in display order', async () => {
        expect(await hub().categories()).toEqual([
          { name: 'Samples', count: 3 },
          { name: 'Banking', count: 1 },
          { name: 'Payments', count: 1 },
          { name: 'Telco', count: 1 },
          { name: 'Events', count: 1 },
          { name: 'Retail', count: 1 },
        ]);
      });

      it('returns a package with the API versions already in the catalogue, or undefined', async () => {
        const pastry = await hub().get('pastry');
        expect(pastry).toMatchObject({ id: 'pastry', installed: true });
        expect(pastry?.apis?.map((a) => a.inCatalogue)).toEqual([['2.0', '1.0'], ['0.1.0']]);
        expect(await hub().get('nope')).toBeUndefined();
      });
    });

    describe('HubRepository.install', () => {
      it('marks the package installed, visible on the next read', async () => {
        expect((await hub().get('banking'))?.installed).toBe(false);
        const installed = await hub().install('banking', { version: '1.2.0', mode: 'sync', role: 'user', artifactRole: 'main' });
        expect(installed).toMatchObject({ id: 'banking', installed: true });
        expect((await hub().get('banking'))?.installed).toBe(true);
      });

      it('fails with NotFoundError for an unknown package', async () => {
        await expectNotFound(hub().install('nope', { version: '1.0', mode: 'sync', role: 'user' }));
      });
    });

    describe('AdminRepository users / setRole', () => {
      it('lists the 7 users with the groups they belong to', async () => {
        const users = await admin().users();
        expect(users.map((u) => u.id)).toEqual(['admin', 'manager', 'user', 'clara.nguyen', 'yanis.benali', 'tom.keller', 'lea.martin']);
        expect(users.find((u) => u.id === 'tom.keller')?.groups).toEqual(['pastry', 'pets']);
      });

      it('changes a role, visible on the next read', async () => {
        expect(await admin().setRole('lea.martin', 'manager')).toMatchObject({ id: 'lea.martin', role: 'manager' });
        expect((await admin().users()).find((u) => u.id === 'lea.martin')?.role).toBe('manager');
      });

      it('fails with NotFoundError for an unknown user', async () => {
        await expectNotFound(admin().setRole('nope', 'user'));
      });
    });

    describe('AdminRepository groups / saveMembers / requests / approveRequest', () => {
      it('lists the 6 manager groups with their pending requests', async () => {
        const groups = await admin().groups();
        expect(groups.map((g) => g.id)).toEqual(['pastry', 'movies', 'pets', 'users', 'legacy', 'beer']);
        expect(groups.find((g) => g.id === 'beer')).toMatchObject({ members: [], pendingRequests: 1 });
      });

      it('saves the members of a group, visible in the groups and the users', async () => {
        expect((await admin().saveMembers('pets', ['lea.martin'])).members).toEqual(['lea.martin']);
        expect((await admin().groups()).find((g) => g.id === 'pets')?.members).toEqual(['lea.martin']);
        expect((await admin().users()).find((u) => u.id === 'tom.keller')?.groups).toEqual(['pastry']);
      });

      it('fails with NotFoundError when saving an unknown group', async () => {
        await expectNotFound(admin().saveMembers('nope', []));
      });

      it('approving a request adds the user to the group and removes the request', async () => {
        expect((await admin().requests()).map((r) => r.id)).toEqual(['req-1', 'req-2']);
        await admin().approveRequest('req-1');
        expect((await admin().requests()).map((r) => r.id)).toEqual(['req-2']);
        expect((await admin().groups()).find((g) => g.id === 'beer')).toMatchObject({ members: ['clara.nguyen'], pendingRequests: 0 });
        await expectNotFound(admin().approveRequest('req-1'));
      });
    });

    describe('AdminRepository snapshots', () => {
      it('offers the 10 API services in export order (agents are not exported)', async () => {
        expect((await admin().snapshotServices()).map((s) => s.id)).toEqual(['pastry2', 'pastry1', 'orders', 'usersignedup', 'hellogrpc', 'movie', 'hellosoap', 'petstore', 'beer', 'rocks']);
      });

      it('exports the chosen services with their operations and estimated size', async () => {
        const snapshot = await admin().snapshot(['pastry2', 'orders']);
        expect(snapshot).toMatchObject({ fileName: 'microcks-repository.json', serviceIds: ['pastry2', 'orders'], operations: 4, sizeKb: 28 });
        expect(JSON.parse(snapshot.json).services.map((s: { id: string }) => s.id)).toEqual(['pastry2', 'orders']);
      });

      it('previews then imports a snapshot file', async () => {
        expect((await admin().snapshotImportPreview('repo.json')).map((p) => p.kind)).toEqual(['replace', 'replace', 'new']);
        expect(await admin().importSnapshot('repo.json')).toEqual({ created: 1, replaced: 2 });
      });
    });

    describe('AdminRepository flags / setFlag', () => {
      it('lists the 7 feature flags, 6 enabled', async () => {
        const flags = await admin().flags();
        expect(flags).toHaveLength(7);
        expect(flags.filter((f) => f.enabled)).toHaveLength(6);
      });

      it('toggles a flag, visible on the next read', async () => {
        expect(await admin().setFlag('filter', true)).toMatchObject({ id: 'filter', enabled: true });
        expect((await admin().flags()).find((f) => f.id === 'filter')?.enabled).toBe(true);
      });

      it('fails with NotFoundError for an unknown flag', async () => {
        await expectNotFound(admin().setFlag('nope', true));
      });
    });
  });
}
