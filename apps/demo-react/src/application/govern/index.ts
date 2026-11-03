import type {
  AdminGroup,
  AdminUser,
  FeatureFlag,
  HubPackage,
  InstallOptions,
  MembershipRequest,
  Role,
  Snapshot,
} from '@/domain/govern';
import type { SecretSummary } from '@/domain/shared';
import { NotFoundError } from '@/application/shared';
import type { AdminRepository, HubRepository } from '@/application/ports/govern';
import type { SecretRepository } from '@/application/ports/importing';

export type GovernPorts = { hub: HubRepository; admin: AdminRepository; secrets: SecretRepository };

export interface GovernUseCases {
  // Hub
  listPackages(filter?: { query?: string; category?: string }): Promise<HubPackage[]>;
  listCategories(): Promise<{ name: string; count: number }[]>;
  /** Throws `NotFoundError`. */
  getPackage(id: string): Promise<HubPackage>;
  /** `onProgress` receives 0..100 while installing. */
  install(id: string, options: InstallOptions, onProgress?: (percent: number) => void): Promise<HubPackage>;
  // Admin
  listUsers(): Promise<AdminUser[]>;
  setRole(userId: string, role: Role): Promise<AdminUser>;
  listGroups(): Promise<AdminGroup[]>;
  saveMembers(groupId: string, members: string[]): Promise<AdminGroup>;
  listRequests(): Promise<MembershipRequest[]>;
  approveRequest(requestId: string): Promise<void>;
  listSecrets(): Promise<SecretSummary[]>;
  createSecret(input: { name: string; kind: SecretSummary['kind']; description?: string; value: string }): Promise<SecretSummary>;
  deleteSecret(id: string): Promise<void>;
  exportSnapshot(serviceIds: string[]): Promise<Snapshot>;
  listFlags(): Promise<FeatureFlag[]>;
  setFlag(id: string, enabled: boolean): Promise<FeatureFlag>;
}

export function createGovernUseCases({ hub, admin, secrets }: GovernPorts): GovernUseCases {
  return {
    listPackages: (filter) => hub.list(filter),
    listCategories: () => hub.categories(),
    getPackage: async (id) => {
      const found = await hub.get(id);
      if (!found) throw new NotFoundError('Package', id);
      return found;
    },
    install: async (id, options, onProgress) => {
      onProgress?.(0);
      const installed = await hub.install(id, options);
      onProgress?.(100);
      return installed;
    },
    listUsers: () => admin.users(),
    setRole: (userId, role) => admin.setRole(userId, role),
    listGroups: () => admin.groups(),
    saveMembers: (groupId, members) => admin.saveMembers(groupId, members),
    listRequests: () => admin.requests(),
    approveRequest: (id) => admin.approveRequest(id),
    listSecrets: () => secrets.list(),
    createSecret: (input) => secrets.create(input),
    deleteSecret: (id) => secrets.remove(id),
    exportSnapshot: (ids) => admin.snapshot(ids),
    listFlags: () => admin.flags(),
    setFlag: (id, enabled) => admin.setFlag(id, enabled),
  };
}
