import type { Protocol } from '../shared/index.js';

export type Role = 'admin' | 'manager' | 'user';

/** One API of a Hub package. */
export interface HubApi {
  protocol: Protocol;
  name: string;
  versions: string[];
  operations: Record<string, number>;
  examples: Record<string, number>;
  contracts: string;
  /** Ships a Postman collection as a secondary artifact. */
  postman?: boolean;
  /** Versions that already exist in this instance's catalogue. */
  inCatalogue: string[];
}

export interface HubPackage {
  id: string;
  name: string;
  /** Category label ("Samples", "Banking"...). */
  category: string;
  description: string;
  /** Distinct versions of its APIs. */
  versions: string[];
  apiCount: number;
  installed: boolean;
  apis?: HubApi[];
  /** "updated Oct 21, 2026" */
  updated?: string;
}

export type InstallMode = 'sync' | 'one-shot';
export type ArtifactRole = 'main' | 'secondary';

export interface InstallOptions {
  version: string;
  mode: InstallMode;
  role: Role;
  /** Role of the imported artifacts: creates Services (main) or only merges examples (secondary). */
  artifactRole?: ArtifactRole;
  /** Version picked per API name. */
  versions?: Record<string, string>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Ids of the groups the user belongs to. */
  groups: string[];
  initials?: string;
  /** The signed-in user: their role cannot be changed here. */
  self?: boolean;
}

export interface AdminGroup {
  id: string;
  name: string;
  /** User ids. */
  members: string[];
  pendingRequests: number;
  /** Services governed by the group (master label value). */
  services?: string[];
}

export interface MembershipRequest {
  id: string;
  groupId: string;
  userId: string;
  requestedAt: string;
}

export interface FeatureFlag {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  /** Current value, shown in the Configuration tab. */
  value?: string;
  /** Property key. */
  key?: string;
}

export interface Snapshot {
  fileName: string;
  serviceIds: string[];
  json: string;
  operations?: number;
  /** Approximate file size in KB. */
  sizeKb?: number;
}

export interface SnapshotImportPreviewItem {
  name: string;
  protocol: Protocol;
  effect: string;
  kind: 'new' | 'replace';
}
