import type {
  AdminGroup,
  AdminUser,
  FeatureFlag,
  HubPackage,
  InstallOptions,
  MembershipRequest,
  Role,
  Snapshot,
  SnapshotImportPreviewItem,
} from '@/domain/govern';
import type { SecretSummary, ServiceSummary } from '@/domain/shared';
import { validateSecretForm } from '@/domain/govern';
import { NotFoundError, ValidationError } from '@/application/shared';
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
  /** Services a snapshot can hold, in the order of the export list. */
  listSnapshotServices(): Promise<ServiceSummary[]>;
  exportSnapshot(serviceIds: string[]): Promise<Snapshot>;
  previewSnapshotImport(fileName: string): Promise<SnapshotImportPreviewItem[]>;
  importSnapshot(fileName: string): Promise<{ created: number; replaced: number }>;
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
      const current = await hub.get(id);
      if (!current) throw new NotFoundError('Package', id);
      if (current.installed) throw new ValidationError(`${current.name} is already installed.`);
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
    createSecret: async (input) => {
      const existing = (await secrets.list()).map((x) => x.name);
      const errors = validateSecretForm({ name: input.name, kind: input.kind, description: input.description ?? '', secret: input.value }, existing);
      const first = Object.values(errors)[0];
      if (first) throw new ValidationError(first);
      return secrets.create(input);
    },
    deleteSecret: (id) => secrets.remove(id),
    listSnapshotServices: () => admin.snapshotServices(),
    exportSnapshot: (ids) => admin.snapshot(ids),
    previewSnapshotImport: (name) => admin.snapshotImportPreview(name),
    importSnapshot: (name) => admin.importSnapshot(name),
    listFlags: () => admin.flags(),
    setFlag: (id, enabled) => admin.setFlag(id, enabled),
  };
}
