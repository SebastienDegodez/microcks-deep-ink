// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { AdminGroup, AdminUser, FeatureFlag } from '@/domain/govern';
import { FixedClock } from '@/infrastructure/in-memory/shared';
import { createInMemoryGovernAdapters } from '@/infrastructure/in-memory/govern';
import {
  estimateSnapshotSizeKb,
  readSnapshotImportResult,
  toAdminGroup,
  toAdminUser,
  toFeatureFlags,
  toFeaturesConfig,
  toKeycloakGroup,
  toKeycloakUser,
  toRole,
  toSnapshot,
  toSnapshotImportResult,
} from './mapping';
import { createHttpGovernAdapters } from '.';
import type { HttpClient } from '@/infrastructure/http/client';
import type { KeycloakGroup, KeycloakUser, MicrocksFeaturesConfig } from './microcks';

const roundTrip = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const seeded = () => createInMemoryGovernAdapters({ clock: new FixedClock() }).admin;

describe('Keycloak users', () => {
  it('maps a user to a Keycloak representation: names split, one realm role, group paths', () => {
    const groups: AdminGroup[] = [{ id: 'pastry', name: '/microcks/manager/pastry', members: ['clara.nguyen'], pendingRequests: 0 }];
    const user: AdminUser = { id: 'clara.nguyen', name: 'Clara Nguyen', email: 'clara@acme.io', role: 'manager', groups: ['pastry'], initials: 'CN' };
    expect(toKeycloakUser(user, groups)).toEqual({
      id: 'clara.nguyen', username: 'clara.nguyen', email: 'clara@acme.io', firstName: 'Clara', lastName: 'Nguyen',
      realmRoles: ['manager'], groups: ['/microcks/manager/pastry'], demo: { initials: 'CN' },
    });
  });

  it('reads a plain Keycloak user (no demo extension) with its strongest Microcks role', () => {
    const plain: KeycloakUser = { id: 'u1', username: 'jdoe', email: 'j@acme.io', firstName: 'Jane', lastName: '', realmRoles: ['offline_access', 'user', 'manager'], groups: ['/microcks/manager/pets'] };
    expect(toAdminUser(plain)).toEqual({ id: 'u1', name: 'Jane', email: 'j@acme.io', role: 'manager', groups: ['pets'] });
    expect(toRole(['offline_access'])).toBe('user');
    expect(toRole(['user', 'admin'])).toBe('admin');
  });

  it('round-trips every seeded user', async () => {
    const admin = seeded();
    const [users, groups] = await Promise.all([admin.users(), admin.groups()]);
    expect(users.map((u) => toAdminUser(roundTrip(toKeycloakUser(u, groups))))).toEqual(users);
  });
});

describe('Keycloak groups', () => {
  it('maps a manager group: name is the last path segment, members and requests in the demo extension', () => {
    const group: AdminGroup = { id: 'pets', name: '/microcks/manager/pets', members: ['tom.keller'], pendingRequests: 1, services: ['Petstore API 1.0.0'] };
    const dto = toKeycloakGroup(group);
    expect(dto).toEqual<KeycloakGroup>({
      id: 'pets', name: 'pets', path: '/microcks/manager/pets', attributes: { services: ['Petstore API 1.0.0'] }, demo: { members: ['tom.keller'], pendingRequests: 1 },
    });
    expect(toAdminGroup(roundTrip(dto))).toEqual(group);
  });

  it('round-trips every seeded group', async () => {
    const groups = await seeded().groups();
    expect(groups.map((g) => toAdminGroup(roundTrip(toKeycloakGroup(g))))).toEqual(groups);
  });
});

describe('snapshots', () => {
  it('reads the exported file: operation count (numbers or lists) and estimated size', () => {
    const file = { services: [{ id: 'a', operations: 3 }, { id: 'b', operations: [{}, {}] }, { id: 'c' }] };
    const snapshot = toSnapshot(file, ['a', 'b', 'c']);
    expect(snapshot).toMatchObject({ fileName: 'microcks-repository.json', serviceIds: ['a', 'b', 'c'], operations: 5, sizeKb: estimateSnapshotSizeKb(5) });
    expect(JSON.parse(snapshot.json)).toEqual(file);
  });

  it('gives back the same snapshot as the in-memory export', async () => {
    const expected = await seeded().snapshot(['pastry2', 'orders']);
    expect(toSnapshot(JSON.parse(expected.json), ['pastry2', 'orders'])).toEqual(expected);
  });
});

describe('features', () => {
  it('serves each flag as a Microcks feature with a string `enabled`', async () => {
    const config = toFeaturesConfig(await seeded().flags());
    expect(config['repository-filter']).toEqual({ enabled: 'false' });
    expect(config['microcks-hub']).toEqual({ enabled: 'true' });
    expect(config.keycloak).toBeUndefined();
  });

  it('takes the state from Microcks (features and Keycloak) and the labels from the demo extension', () => {
    const flags: FeatureFlag[] = [
      { id: 'filter', label: 'Repository filter', description: '', enabled: false },
      { id: 'keycloak', label: 'Keycloak', description: '', enabled: true },
      { id: 'mcp', label: 'MCP', description: '', enabled: true },
    ];
    const config: MicrocksFeaturesConfig = { 'repository-filter': { enabled: 'true', 'label-key': 'domain' }, demo: { flags } };
    expect(toFeatureFlags(config, { enabled: false }).map((f) => [f.id, f.enabled])).toEqual([['filter', true], ['keycloak', false], ['mcp', true]]);
  });

  it('round-trips the seeded flags', async () => {
    const flags = await seeded().flags();
    expect(toFeatureFlags(roundTrip(toFeaturesConfig(flags)), { enabled: true })).toEqual(flags);
  });

  it('reads a real Microcks FeaturesConfig (no demo extension): one flag per feature, then Keycloak', () => {
    // The example of `FeaturesConfig` in microcks-openapi-v1.15.yaml.
    const config: MicrocksFeaturesConfig = {
      'repository-filter': { 'label-label': 'Domain', enabled: 'true', 'label-list': 'domain,status', 'label-key': 'domain' },
      'microcks-hub': { 'allowed-roles': 'admin,manager,manager-any', endpoint: 'https://hub.microcks.io/api', enabled: 'true' },
      'repository-tenancy': { enabled: 'false', 'artifact-import-allowed-roles': 'admin,manager,manager-any' },
      'async-api': { 'default-binding': 'KAFKA', enabled: 'true' },
      'custom-thing': { enabled: 'false' },
    };
    const keycloak = { realm: 'microcks', 'auth-server-url': 'https://sso.acme.io', 'public-client': true, 'ssl-required': 'external' as const, resource: 'microcks-app', enabled: true };
    const flags = toFeatureFlags(config, keycloak);
    expect(flags.map((f) => [f.id, f.label, f.enabled])).toEqual([
      ['filter', 'Repository filter', true],
      ['hub', 'Microcks Hub', true],
      ['tenancy', 'Repository tenancy', false],
      ['async-api', 'Async API mocking', true],
      ['custom-thing', 'custom-thing', false],
      ['keycloak', 'Keycloak authentication', true],
    ]);
    expect(flags[1]).toMatchObject({ value: 'allowed-roles admin,manager,manager-any · endpoint https://hub.microcks.io/api', key: 'features.feature.microcks-hub.enabled=true' });
    expect(flags[5]).toMatchObject({ value: 'realm microcks · client microcks-app · https://sso.acme.io', key: 'keycloak.enabled=true' });
    expect(toFeatureFlags({}, { enabled: false }).map((f) => [f.id, f.enabled])).toEqual([['keycloak', false]]);
  });
});

describe('snapshot import result', () => {
  it('reads the demo body', () => {
    expect(readSnapshotImportResult({ created: 1, replaced: 2 })).toEqual({ created: 1, replaced: 2 });
  });

  it('a real Microcks answers 201 without a body: the summary comes from the services count', () => {
    for (const body of [undefined, null, '', {}]) expect(readSnapshotImportResult(body)).toBeUndefined();
    expect(toSnapshotImportResult(10, 12)).toEqual({ created: 2, replaced: 0 });
    expect(toSnapshotImportResult(10, 10)).toEqual({ created: 0, replaced: 0 });
    expect(toSnapshotImportResult(10, 9)).toEqual({ created: 0, replaced: 0 });
  });
});

describe('adapters over a real Microcks (no demo extensions)', () => {
  /** Answers like Microcks: `POST /api/import` 201 without a body, `FeaturesConfig` without `demo`. */
  function microcks(): HttpClient {
    let services = 10;
    const get = async (path: string): Promise<unknown> => {
      if (path === 'services/count') return { counter: services };
      if (path === 'features/config') return { 'microcks-hub': { enabled: 'true' }, 'repository-filter': { enabled: 'false' } };
      if (path === 'keycloak/config') return { enabled: false };
      throw new Error(`unexpected GET ${path}`);
    };
    const post = async (path: string): Promise<unknown> => {
      if (path !== 'import') throw new Error(`unexpected POST ${path}`);
      services += 1;
      return undefined;
    };
    const unexpected = async () => { throw new Error('unexpected call'); };
    return { get, post, put: unexpected, patch: unexpected, delete: unexpected } as unknown as HttpClient;
  }

  it('imports a snapshot answered without a body', async () => {
    const { admin } = createHttpGovernAdapters({ http: microcks(), clock: new FixedClock() });
    expect(await admin.importSnapshot('repo.json')).toEqual({ created: 1, replaced: 0 });
  });

  it('lists the flags of a FeaturesConfig without the demo extension', async () => {
    const { admin } = createHttpGovernAdapters({ http: microcks(), clock: new FixedClock() });
    expect((await admin.flags()).map((f) => [f.id, f.enabled])).toEqual([['hub', true], ['filter', false], ['keycloak', false]]);
  });
});
