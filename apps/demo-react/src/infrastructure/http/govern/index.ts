/**
 * HTTP adapters of the govern feature (see `./microcks.ts` for the endpoints): snapshots and features over the
 * Microcks API, users and groups over the Keycloak-backed `/api/admin/...` (outside the Microcks API), the Hub over
 * demo-only endpoints. Secrets are the importing feature's (`createHttpImportingAdapters().secrets`).
 */
import type { FeatureFlag, HubPackage, MembershipRequest, SnapshotImportPreviewItem } from '@/domain/govern';
import type { ServiceSummary } from '@/domain/shared';
import type { AdminRepository, HubRepository } from '@/application/ports/govern';
import type { Clock } from '@/application/ports/shared';
import { NotFoundError } from '@/application/shared';
import type { HttpClient } from '@/infrastructure/http/client';
import { readSnapshotImportResult, toAdminGroup, toAdminUser, toFeatureFlags, toSnapshot, toSnapshotImportResult } from './mapping';
import type {
  KeycloakGroup,
  KeycloakUser,
  MicrocksCounter,
  MicrocksFeaturesConfig,
  MicrocksKeycloakConfig,
  MicrocksSnapshotFile,
} from './microcks';

export interface HttpGovernDeps {
  http: HttpClient;
  clock: Clock;
}

export interface HttpGovernAdapters {
  hub: HubRepository;
  admin: AdminRepository;
}

/** A multipart body holding an (empty) snapshot file: the demo only knows the chosen file's name. */
function snapshotForm(fileName: string): FormData {
  const form = new FormData();
  form.append('file', new Blob([], { type: 'application/json' }), fileName);
  return form;
}

export function createHttpGovernAdapters({ http }: HttpGovernDeps): HttpGovernAdapters {
  const servicesCount = async () => (await http.get<MicrocksCounter>('services/count')).counter;
  const pkg = (id: string) => `demo/hub/packages/${encodeURIComponent(id)}`;

  const hub: HubRepository = {
    list: (filter = {}) => http.get<HubPackage[]>('demo/hub/packages', { query: { query: filter.query, category: filter.category } }),
    categories: () => http.get<{ name: string; count: number }[]>('demo/hub/categories'),
    async get(id) {
      try {
        return await http.get<HubPackage>(pkg(id));
      } catch (error) {
        if (error instanceof NotFoundError) return undefined;
        throw error;
      }
    },
    install: (id, options) => http.post<HubPackage>(`${pkg(id)}/install`, options),
  };

  const admin: AdminRepository = {
    async users() {
      return (await http.get<KeycloakUser[]>('admin/users')).map(toAdminUser);
    },
    async setRole(userId, role) {
      return toAdminUser(await http.put<KeycloakUser>(`admin/users/${encodeURIComponent(userId)}/roles`, [role]));
    },
    async groups() {
      return (await http.get<KeycloakGroup[]>('admin/groups')).map(toAdminGroup);
    },
    async saveMembers(groupId, members) {
      return toAdminGroup(await http.put<KeycloakGroup>(`admin/groups/${encodeURIComponent(groupId)}/members`, members));
    },
    requests: () => http.get<MembershipRequest[]>('admin/requests'),
    async approveRequest(requestId) {
      await http.post(`admin/requests/${encodeURIComponent(requestId)}/approve`);
    },
    snapshotServices: () => http.get<ServiceSummary[]>('demo/snapshot/services'),
    async snapshot(serviceIds) {
      return toSnapshot(await http.get<MicrocksSnapshotFile>('export', { query: { serviceIds } }), serviceIds);
    },
    snapshotImportPreview: (fileName) => http.post<SnapshotImportPreviewItem[]>('demo/import/preview', snapshotForm(fileName)),
    async importSnapshot(fileName) {
      const before = await servicesCount();
      const answered = readSnapshotImportResult(await http.post<unknown>('import', snapshotForm(fileName)));
      return answered ?? toSnapshotImportResult(before, await servicesCount());
    },
    async flags() {
      const [config, keycloak] = await Promise.all([http.get<MicrocksFeaturesConfig>('features/config'), http.get<MicrocksKeycloakConfig>('keycloak/config')]);
      return toFeatureFlags(config, keycloak);
    },
    setFlag: (id, enabled) => http.put<FeatureFlag>(`demo/features/${encodeURIComponent(id)}`, { enabled }),
  };

  return { hub, admin };
}
