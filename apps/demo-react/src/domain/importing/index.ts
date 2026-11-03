import type { Protocol } from '@/domain/shared';

export type ImportSource =
  | { kind: 'file'; files: { name: string; sizeBytes: number }[] }
  | { kind: 'url'; url: string }
  | { kind: 'git'; repository: string; ref?: string; path?: string };

export type ArtifactKind = 'openapi' | 'asyncapi' | 'graphql' | 'grpc' | 'soap' | 'postman' | 'arazzo' | 'unknown';

export interface DetectedService {
  name: string;
  version: string;
  protocol: Protocol;
  kind: ArtifactKind;
  operations: { method: string; path: string }[];
  /** True when the service already exists in the catalogue (the import updates it). */
  exists: boolean;
}

export interface ImportPreview {
  previewId: string;
  source: ImportSource;
  services: DetectedService[];
  warnings: string[];
}

export interface ImportOptions {
  /** `primary` artifact defines the service, `secondary` enriches it (examples). */
  role: 'primary' | 'secondary';
  secretId?: string;
}

export interface ImportResult {
  serviceId: string;
  name: string;
  version: string;
  operationCount: number;
}

export interface DirectApiInput {
  type: 'REST' | 'GENERIC_EVENT';
  name: string;
  version: string;
  resource: string;
}

export interface Importer {
  id: string;
  name: string;
  source: ImportSource;
  kind: ArtifactKind;
  active: boolean;
  /** `running` while a synchronisation is in progress. */
  state: 'idle' | 'running' | 'failed';
  schedule: string;
  lastSyncAt?: string;
  secretName?: string;
  versions: ImporterVersion[];
}

export interface ImporterVersion {
  id: string;
  label: string;
  syncedAt: string;
  summary: string;
}

export interface DiffLine {
  kind: 'added' | 'removed' | 'context';
  text: string;
}

export interface ImporterDiff {
  from: string;
  to: string;
  lines: DiffLine[];
}
