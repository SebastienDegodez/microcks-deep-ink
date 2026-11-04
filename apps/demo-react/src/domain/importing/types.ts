import type { Label, Protocol } from '@/domain/shared';


export type ImportSource =
  | { kind: 'file'; files: { name: string; sizeBytes: number }[]; /** One of the Microcks samples or examples, not a file of the person. */ sample?: boolean }
  | { kind: 'url'; url: string; secretName?: string }
  | {
      kind: 'git';
      repository: string;
      /** Name of the scheduled importer ("API Pastry — main"). */
      name?: string;
      ref?: string;
      path?: string;
      secretName?: string;
      insecure?: boolean;
    };

export type ArtifactKind = 'openapi' | 'asyncapi' | 'graphql' | 'grpc' | 'soap' | 'postman' | 'arazzo' | 'a2a' | 'unknown';

/** Where a source comes from: a file uploaded once, or a URL, Git repository or Hub package Microcks keeps in sync. */
export type SourceOrigin = 'upload' | 'url' | 'git' | 'hub';

export const SOURCE_ORIGINS: readonly { id: SourceOrigin; label: string; fact: string }[] = [
  { id: 'upload', label: 'Upload', fact: 'Upload · one-off file' },
  { id: 'url', label: 'URL', fact: 'URL · scheduled' },
  { id: 'git', label: 'Git', fact: 'Git repository · scheduled' },
  { id: 'hub', label: 'Hub', fact: 'Hub package · scheduled' },
];

export interface DetectedOperation {
  method: string;
  path: string;
  dispatcher?: string;
  exampleCount?: number;
}

export interface DetectedService {
  name: string;
  version: string;
  protocol: Protocol;
  kind: ArtifactKind;
  operations: DetectedOperation[];
  /** True when the service already exists in the catalogue (the import updates it). */
  exists: boolean;
}

export interface DetectedWorkflow {
  workflowId: string;
  name: string;
  steps: number;
  /** "AsyncAPI · not runnable yet", "step dependsOn · 3 parallel steps". */
  note?: string;
  blocked?: boolean;
}

export interface DetectedSourceDescription {
  name: string;
  type: 'openapi' | 'asyncapi';
  url: string;
  protocol: Protocol;
  service: string;
  operationsFound: string;
}

/** What Microcks understood of an Arazzo document. */
export interface ArazzoPreview {
  fileName: string;
  title: string;
  version: string;
  arazzoVersion: string;
  overlay: string;
  workflows: DetectedWorkflow[];
  sources: DetectedSourceDescription[];
}

/** What Microcks understood of an A2A Agent Card (a projection: the v2 module turns skills into operations). */
export interface AgentPreview {
  fileName: string;
  provider: string;
  specVersion: string;
  /** `modes`: "text in · application/json out"; `note`: "multi-turn · input-required". */
  skills: { id: string; name: string; modes?: string; note?: string }[];
  /** `supportedInterfaces`, in order. */
  interfaces: { binding: string; url: string; preferred: boolean }[];
  /** The same interfaces once the card is served by the mock. */
  mockInterfaces: { binding: string; url: string }[];
  security: string;
  /** Every capability the card declares, on or off. */
  capabilities: { name: string; on: boolean }[];
  modes: string[];
}

export interface ImportPreview {
  previewId: string;
  source: ImportSource;
  services: DetectedService[];
  warnings: string[];
  /** File name of the artifact, `apipastry-openapi.yaml`. */
  artifactName?: string;
  /** `OpenAPI 3.1` */
  formatLabel?: string;
  /** Where it comes from, one sentence. */
  origin?: string;
  exampleCount?: number;
  arazzo?: ArazzoPreview;
  agent?: AgentPreview;
}

export interface ImportOptions {
  /** `primary` artifact defines the service, `secondary` enriches it (examples). */
  role: 'primary' | 'secondary';
  secretId?: string;
}

export type ImportOutcome = 'imported' | 'merged' | 'importer-created' | 'arazzo' | 'direct' | 'a2a';

export interface ImportResult {
  serviceId: string;
  name: string;
  version: string;
  operationCount: number;
  outcome?: ImportOutcome;
  protocol?: Protocol | 'ARAZZO';
  /** "7" or "1 payload" or "dynamic". */
  samples?: string;
  mcp?: boolean;
  /** "Mock base URL" or "Mock Kafka topic". */
  mockLabel?: string;
  mockUrl?: string;
  /** Command to try the mock right away. */
  tryIt?: string;
  arazzo?: { documentId: string; workflows: number; steps: number; sources: number };
  /** A2A agents: skills turned into operations, scripted conversations found, transports served. */
  agent?: { skills: number; conversations: number; transports: string[] };
  /** Name of the scheduled importer created from a Git repository. */
  importerName?: string;
  /** Direct APIs: the resource the mock serves ("order"). */
  resource?: string;
  /** Mock endpoints, one per transport (A2A agents). */
  endpoints?: { binding: string; url: string }[];
  /** The source created by the import, as listed in Sources (none for a Direct API). */
  createdSource?: CreatedSource;
}

/** One line of the done screen: the source the import created. */
export interface CreatedSource {
  /** "API Pastry 2.0 · OpenAPI" */
  name: string;
  /** "apipastry-openapi.yaml · primary" */
  detail: string;
  /** "Upload", "URL", "Git". */
  origin: string;
  /** "no schedule · one-off" */
  schedule: string;
}

export interface DirectApiInput {
  type: 'REST' | 'GENERIC_EVENT';
  name: string;
  version: string;
  resource: string;
  /** Reference JSON payload (required for events, a template for REST). */
  payload?: string;
}

export type SyncResult = 'imported' | 'warning' | 'failed' | 'paused';

export interface SyncChange {
  /** `+` added, `~` changed, `-` removed, `!` skipped. */
  sign: '+' | '~' | '-' | '!';
  text: string;
}

export type SyncEntry =
  | { kind: 'group'; id: string; text: string }
  | {
      kind: 'run';
      id: string;
      at: string;
      /** "Scheduled", "Forced by MA", "Created by MA", "Stopped by MA". */
      trigger: string;
      result: SyncResult;
      changes: SyncChange[];
      /** One sentence under the line ("initial import · 2 operations"). */
      note?: string;
      /** `3c9e1d0 → a41f9c2`: the entry has a diff. */
      revision?: string;
    };

export interface ImporterVersion {
  id: string;
  label: string;
  syncedAt: string;
  summary: string;
}

export interface ProducedService {
  id?: string;
  protocol: Protocol;
  name: string;
  version: string;
}

export interface Importer {
  id: string;
  name: string;
  source: ImportSource;
  kind: ArtifactKind;
  /** Uploads run once and have no schedule; the other origins are scanned on the global schedule. */
  origin: SourceOrigin;
  active: boolean;
  /** `running` while a synchronisation is in progress. */
  state: 'idle' | 'running' | 'failed';
  schedule: string;
  lastSyncAt?: string;
  secretName?: string;
  versions: ImporterVersion[];
  /** URL of the artifact. */
  url: string;
  role: 'primary' | 'secondary';
  /** Microcks artifact type, `OPEN_API_SPEC`, `ArazzoSources`... */
  artifactLabel: string;
  artifactNote?: string;
  secretType?: string;
  sslValidation: boolean;
  labels: Label[];
  createdAt: string;
  createdBy: string;
  produces: ProducedService[];
  /** Arazzo importers: "4 workflows". */
  workflows?: string;
  /** "Services produced" by default, "Overlay of" for an overlay. */
  producedLabel?: string;
  /** Outcome of the last import. */
  health: 'imported' | 'warning' | 'failed';
  error?: { message: string; since: string; detail: string; servedSince: string };
  warning?: string;
  timeline: SyncEntry[];
}

export interface DiffLine {
  kind: 'added' | 'removed' | 'context' | 'hunk' | 'skipped';
  text: string;
}

export interface ImporterDiff {
  from: string;
  to: string;
  file?: string;
  lines: DiffLine[];
}

/** A line of "Recent imports". */
export interface RecentImport {
  id: string;
  protocol: Protocol | 'ARAZZO';
  name: string;
  at: string;
  via: string;
  status: 'imported' | 'warning' | 'created';
  statusText: string;
  note: string;
}
