/**
 * Wire format of the importing API: the Microcks REST API v1.15 (https://github.com/microcks/microcks/blob/master/api/microcks-openapi-v1.15.yaml)
 * plus the demo extensions marked "proposition v2 / not in Microcks API".
 *
 * Microcks endpoints used:
 * - `GET    /api/jobs/count`                         -> `Counter`
 * - `GET    /api/jobs?page&size`                     -> `ImportJob[]` (Microcks pages by 20 by default)
 * - `GET    /api/jobs/{id}`                          -> `ImportJob` (an unknown id answers 200 with an empty body)
 * - `POST   /api/jobs` (`ImportJob`)                 -> 201 `ImportJob` (a Git repository becomes a scheduled importer)
 * - `PUT    /api/jobs/{id}/start`                    -> `ImportJob` (forces a synchronisation)
 * - `PUT    /api/jobs/{id}/activate` | `/stop`       -> `ImportJob` (resumes / pauses the schedule)
 * - `DELETE /api/jobs/{id}`                          -> 200
 * - `POST   /api/artifact/upload?mainArtifact` (multipart `file`)              -> 201 text `name:version`
 * - `POST   /api/artifact/download` (form `url`, `mainArtifact`, `secretName`) -> 201 text `name:version`
 * - `GET    /api/secrets/count`, `GET /api/secrets?page&size`, `GET /api/secrets/{id}`
 * - `POST   /api/secrets` (`Secret`) -> 201, `PUT /api/secrets/{id}` (`Secret`), `DELETE /api/secrets/{id}`
 *
 * Demo-only (proposition v2 / not in Microcks API):
 * - `POST /api/demo/artifact/analyze` (`ImportSource`) -> `ImportPreview`: what the import will create, before
 *   importing (Microcks imports directly).
 * - `GET  /api/demo/import-results/{previewId}` -> `ImportResult`: the done screen of an import (Microcks answers
 *   the import with `name:version` only). The upload, download and job creation carry the `previewId`.
 * - `GET  /api/demo/recent-imports?size=N` -> `RecentImport[]`, newest first.
 * - `POST /api/demo/direct-apis` (`DirectApiInput`) -> `ImportResult` (Microcks' `/api/services/generic` is not in
 *   its OpenAPI).
 * - `POST /api/demo/jobs/{id}/restore` -> `ImportJob`: undoes a `DELETE /api/jobs/{id}` at the same position.
 * - `GET  /api/demo/jobs/{id}/diff?from&to` -> `ImporterDiff` between two scanned revisions.
 * - the `demo` member of `ImportJob` and `Secret`, and the `previewId` / `secretId` fields of the upload and the
 *   download (what the demo shows or needs that Microcks does not store).
 */
import type { ArtifactKind, Importer, ImporterVersion, SourceOrigin, SyncEntry } from '@/domain/importing';
import type { Protocol, SecretKind } from '@/domain/shared';

/** Microcks `ServiceRef`. */
export interface MicrocksServiceRef {
  serviceId: string;
  name: string;
  version: string;
}

/** Microcks `Metadata` (epoch milliseconds). */
export interface MicrocksMetadata {
  createdOn: number;
  lastUpdate: number;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

/** Microcks `SecretRef`. */
export interface MicrocksSecretRef {
  secretId: string;
  name: string;
}

/** Microcks `ImportJob`. */
export interface MicrocksImportJob {
  id?: string;
  name: string;
  repositoryUrl: string;
  repositoryDisableSSLValidation?: boolean;
  frequency?: string;
  /** Epoch milliseconds. */
  createdDate?: number;
  /** Epoch milliseconds. */
  lastImportDate?: number;
  lastImportError?: string;
  active?: boolean;
  etag?: string;
  serviceRefs?: MicrocksServiceRef[];
  metadata?: MicrocksMetadata;
  secretRef?: MicrocksSecretRef;
  mainArtifact?: boolean;
  /** Proposition v2 / not in Microcks API. */
  demo?: DemoImportJobExtension;
}

/** Proposition v2 / not in Microcks API: what the demo shows about an importer that Microcks does not store. */
export interface DemoImportJobExtension {
  kind?: ArtifactKind;
  origin?: SourceOrigin;
  state?: Importer['state'];
  schedule?: string;
  versions?: ImporterVersion[];
  artifactLabel?: string;
  artifactNote?: string;
  secretType?: string;
  createdBy?: string;
  /** Protocol of each `serviceRefs` item, in order. */
  serviceProtocols?: Protocol[];
  workflows?: string;
  producedLabel?: string;
  health?: Importer['health'];
  error?: Importer['error'];
  warning?: string;
  timeline?: SyncEntry[];
  /** Job creation only: the analysed preview the job comes from. */
  previewId?: string;
  /** Job creation only: the secret chosen on the import screen. */
  secretId?: string;
}

/** Microcks `Secret`. The credential fields are write-only in the demo: its answers never carry them. */
export interface MicrocksSecret {
  id?: string;
  name: string;
  description?: string;
  username?: string;
  password?: string;
  token?: string;
  tokenHeader?: string;
  caCertPem?: string;
  /** Proposition v2 / not in Microcks API. */
  demo?: DemoSecretExtension;
}

/** Proposition v2 / not in Microcks API: the secret's type and its masked summary. */
export interface DemoSecretExtension {
  kind?: SecretKind;
  masked?: string;
  detail?: string;
  usedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Microcks `Counter`. */
export interface MicrocksCounter {
  counter: number;
}

/** Form fields of the upload and the download (proposition v2 / not in Microcks API), next to Microcks' own. */
export const PREVIEW_ID_FIELD = 'previewId';
export const SECRET_ID_FIELD = 'secretId';

/** Microcks credential field that holds the value of each kind of secret. */
export const SECRET_VALUE_FIELD: Record<SecretKind, 'token' | 'password' | 'caCertPem'> = {
  token: 'token',
  basic: 'password',
  oauth2: 'password',
  ca: 'caCertPem',
};
