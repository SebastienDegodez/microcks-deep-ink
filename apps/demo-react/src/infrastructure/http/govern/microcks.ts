/**
 * Wire format of the govern API: the Microcks REST API v1.15 (https://github.com/microcks/microcks/blob/master/api/microcks-openapi-v1.15.yaml),
 * the Keycloak-backed admin endpoints and the demo extensions marked "proposition v2 / not in Microcks API".
 * Secrets are served by the importing adapters (`/api/secrets`, see `../importing/microcks.ts`).
 *
 * Microcks endpoints used:
 * - `GET  /api/export?serviceIds=a&serviceIds=b` -> the snapshot file (`application/json`, `microcks-repository.json`)
 * - `POST /api/import` (multipart `file`)         -> 201 (the demo adds the `{ created, replaced }` body, see below)
 * - `GET  /api/features/config`                   -> `FeaturesConfig`
 * - `GET  /api/keycloak/config`                   -> `KeycloakConfig`
 * - `GET  /api/services/count`                    -> `Counter` (only to summarise an import answered without a body)
 *
 * Outside the Microcks API (Keycloak): Microcks delegates users, roles and groups to its Keycloak realm. The demo
 * serves a Keycloak-like view of them under `/api/admin/...`:
 * - `GET  /api/admin/users` -> `KeycloakUser[]`; `PUT /api/admin/users/{id}/roles` (realm role names) -> `KeycloakUser`
 * - `GET  /api/admin/groups` -> `KeycloakGroup[]`; `PUT /api/admin/groups/{id}/members` (user ids) -> `KeycloakGroup`
 * - `GET  /api/admin/requests` -> `MembershipRequest[]`; `POST /api/admin/requests/{id}/approve` -> 204
 *
 * Demo-only (proposition v2 / not in Microcks API):
 * - `GET  /api/demo/hub/packages?query&category`, `GET /api/demo/hub/packages/{id}`, `GET /api/demo/hub/categories`,
 *   `POST /api/demo/hub/packages/{id}/install` (`InstallOptions`): the Microcks Hub (hub.microcks.io) is a separate
 *   API that the Microcks UI calls directly.
 * - `GET  /api/demo/snapshot/services` -> `ServiceSummary[]`: the services a snapshot can hold, in export order.
 * - `POST /api/demo/import/preview` (multipart `file`) -> `SnapshotImportPreviewItem[]` (Microcks imports directly).
 * - the `{ created, replaced }` body of `POST /api/import` (Microcks answers 201 without a body: the adapters then
 *   count the new services with `GET /api/services/count` before and after the import, replaced ones unknown = 0).
 * - `PUT  /api/demo/features/{id}` (`{ enabled }`) -> `FeatureFlag` (Microcks reads its features from its properties).
 * - the `demo` member of `FeaturesConfig`, `KeycloakUser` and `KeycloakGroup`.
 */
import type { FeatureFlag, Role } from '@/domain/govern';

/** Name of the snapshot file (Microcks' `Content-Disposition: attachment; filename=microcks-repository.json`). */
export const SNAPSHOT_FILE_NAME = 'microcks-repository.json';

/** The service entries of a snapshot file the demo reads (`operations`: a count, or the operations themselves). */
export interface MicrocksSnapshotFile {
  services?: { id?: string; operations?: number | unknown[] }[];
  [key: string]: unknown;
}

/** Answer of the demo's `POST /api/import` (proposition v2 / not in Microcks API). */
export interface DemoSnapshotImportResult {
  created: number;
  replaced: number;
}

/** Microcks `Counter`. */
export interface MicrocksCounter {
  counter: number;
}

/** One feature of Microcks `FeaturesConfig` (its values are strings: `enabled: "true"`). */
export type MicrocksFeature = Record<string, string>;

/** Microcks `FeaturesConfig` (`additionalProperties: true`) + the demo extension. */
export interface MicrocksFeaturesConfig {
  [feature: string]: MicrocksFeature | DemoFeaturesExtension | undefined;
  /** Proposition v2 / not in Microcks API: what the Configuration tab shows about each flag. */
  demo?: DemoFeaturesExtension;
}

export interface DemoFeaturesExtension {
  flags: FeatureFlag[];
}

/** Microcks `KeycloakConfig`. */
export interface MicrocksKeycloakConfig {
  realm: string;
  'auth-server-url': string;
  'public-client': boolean;
  'ssl-required': 'none' | 'external';
  resource: string;
  enabled: boolean;
}

/** Feature of `FeaturesConfig` behind each demo flag (`keycloak` is read from `KeycloakConfig`, `mcp` is built in). */
export const FLAG_FEATURE: Readonly<Record<string, string>> = {
  'async-api': 'async-api',
  'ai-copilot': 'ai-copilot',
  tenancy: 'repository-tenancy',
  hub: 'microcks-hub',
  filter: 'repository-filter',
};
export const KEYCLOAK_FLAG = 'keycloak';

/** Label and description of the Microcks features, for a `FeaturesConfig` without the demo extension. */
export const FEATURE_LABELS: Readonly<Record<string, { label: string; description: string }>> = {
  'async-api': { label: 'Async API mocking', description: 'Event mocks published on brokers' },
  'ai-copilot': { label: 'AI Copilot', description: 'Example generation from the contract' },
  'repository-tenancy': { label: 'Repository tenancy', description: 'Manager groups per master label value' },
  'microcks-hub': { label: 'Microcks Hub', description: 'Browse and install API mocks from the Hub' },
  'repository-filter': { label: 'Repository filter', description: 'Filter the catalogue by a label' },
};
export const KEYCLOAK_LABEL = { label: 'Keycloak authentication', description: 'Identity, roles and groups' };

/** Outside the Microcks API (Keycloak): a Keycloak `UserRepresentation`, reduced to what the admin shows. */
export interface KeycloakUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Microcks realm roles (`admin`, `manager`, `user`). */
  realmRoles: string[];
  /** Group paths (`/microcks/manager/pastry`). */
  groups: string[];
  /** Proposition v2 / not in Microcks API. */
  demo?: { initials?: string; self?: boolean };
}

/** Outside the Microcks API (Keycloak): a Keycloak `GroupRepresentation` of a manager group. */
export interface KeycloakGroup {
  id: string;
  name: string;
  /** `/microcks/manager/<master label value>`. */
  path: string;
  attributes?: { services?: string[] };
  /** Proposition v2 / not in Microcks API: the member ids (Keycloak serves them at `/groups/{id}/members`). */
  demo: { members: string[]; pendingRequests: number };
}

/** Microcks realm roles, strongest first. */
export const ROLES: readonly Role[] = ['admin', 'manager', 'user'];
