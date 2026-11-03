export type Role = 'admin' | 'manager' | 'user';

export interface HubPackage {
  id: string;
  name: string;
  category: string;
  description: string;
  versions: string[];
  apiCount: number;
  installed: boolean;
}

export type InstallMode = 'sync' | 'one-shot';

export interface InstallOptions {
  version: string;
  mode: InstallMode;
  role: Role;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  groups: string[];
}

export interface AdminGroup {
  id: string;
  name: string;
  members: string[];
  pendingRequests: number;
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
}

export interface Snapshot {
  fileName: string;
  serviceIds: string[];
  json: string;
}
