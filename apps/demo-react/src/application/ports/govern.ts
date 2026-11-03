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

export interface HubRepository {
  list(filter?: { query?: string; category?: string }): Promise<HubPackage[]>;
  categories(): Promise<{ name: string; count: number }[]>;
  get(id: string): Promise<HubPackage | undefined>;
  /** Marks the package installed. Progress is simulated by the use case. */
  install(id: string, options: InstallOptions): Promise<HubPackage>;
}

export interface AdminRepository {
  users(): Promise<AdminUser[]>;
  setRole(userId: string, role: Role): Promise<AdminUser>;
  groups(): Promise<AdminGroup[]>;
  saveMembers(groupId: string, members: string[]): Promise<AdminGroup>;
  requests(): Promise<MembershipRequest[]>;
  approveRequest(requestId: string): Promise<void>;
  snapshot(serviceIds: string[]): Promise<Snapshot>;
  /** What importing a snapshot file would do. */
  snapshotImportPreview(fileName: string): Promise<SnapshotImportPreviewItem[]>;
  importSnapshot(fileName: string): Promise<{ created: number; replaced: number }>;
  flags(): Promise<FeatureFlag[]>;
  setFlag(id: string, enabled: boolean): Promise<FeatureFlag>;
}
