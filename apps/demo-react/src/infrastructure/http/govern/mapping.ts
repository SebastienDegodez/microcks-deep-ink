/**
 * Govern DTOs <-> domain. Both directions live here: the HTTP adapters read the DTOs, the MSW handlers
 * (`src/infrastructure/msw/handlers/govern.ts`) write them from the in-memory adapters.
 */
import type { AdminGroup, AdminUser, FeatureFlag, Role, Snapshot } from '@/domain/govern';
import {
  FEATURE_LABELS,
  FLAG_FEATURE,
  KEYCLOAK_FLAG,
  KEYCLOAK_LABEL,
  ROLES,
  SNAPSHOT_FILE_NAME,
  type DemoSnapshotImportResult,
  type KeycloakGroup,
  type KeycloakUser,
  type MicrocksFeature,
  type MicrocksFeaturesConfig,
  type MicrocksKeycloakConfig,
  type MicrocksSnapshotFile,
} from './microcks';

/** Last segment of a Keycloak group path: `/microcks/manager/pastry` -> `pastry`. */
const groupIdOf = (path: string) => path.slice(path.lastIndexOf('/') + 1);

export function toKeycloakUser(user: AdminUser, groups: readonly AdminGroup[]): KeycloakUser {
  const space = user.name.indexOf(' ');
  const demo = { ...(user.initials !== undefined ? { initials: user.initials } : {}), ...(user.self !== undefined ? { self: user.self } : {}) };
  return {
    id: user.id,
    username: user.id,
    email: user.email,
    firstName: space < 0 ? user.name : user.name.slice(0, space),
    lastName: space < 0 ? '' : user.name.slice(space + 1),
    realmRoles: [user.role],
    groups: user.groups.map((id) => groups.find((g) => g.id === id)?.name ?? id),
    ...(Object.keys(demo).length > 0 ? { demo } : {}),
  };
}

/** The strongest Microcks realm role of the user (`user` when none). */
export function toRole(realmRoles: readonly string[]): Role {
  return ROLES.find((r) => realmRoles.includes(r)) ?? 'user';
}

export function toAdminUser(dto: KeycloakUser): AdminUser {
  return {
    id: dto.id,
    name: [dto.firstName, dto.lastName].filter((part) => part !== '').join(' '),
    email: dto.email,
    role: toRole(dto.realmRoles),
    groups: dto.groups.map(groupIdOf),
    ...(dto.demo?.initials !== undefined ? { initials: dto.demo.initials } : {}),
    ...(dto.demo?.self !== undefined ? { self: dto.demo.self } : {}),
  };
}

export function toKeycloakGroup(group: AdminGroup): KeycloakGroup {
  return {
    id: group.id,
    name: groupIdOf(group.name),
    path: group.name,
    ...(group.services ? { attributes: { services: [...group.services] } } : {}),
    demo: { members: [...group.members], pendingRequests: group.pendingRequests },
  };
}

export function toAdminGroup(dto: KeycloakGroup): AdminGroup {
  return {
    id: dto.id,
    name: dto.path,
    members: [...dto.demo.members],
    pendingRequests: dto.demo.pendingRequests,
    ...(dto.attributes?.services ? { services: [...dto.attributes.services] } : {}),
  };
}

/** The demo's estimate of a snapshot file: 4 KB of envelope and about 6 KB per operation. */
export const estimateSnapshotSizeKb = (operations: number) => 4 + operations * 6;

/** The file of `GET /api/export` -> `Snapshot` (the JSON is pretty-printed, as it is downloaded). */
export function toSnapshot(file: MicrocksSnapshotFile, serviceIds: string[]): Snapshot {
  const operations = (file.services ?? []).reduce((n, s) => n + (Array.isArray(s.operations) ? s.operations.length : (s.operations ?? 0)), 0);
  return { fileName: SNAPSHOT_FILE_NAME, serviceIds, operations, sizeKb: estimateSnapshotSizeKb(operations), json: JSON.stringify(file, null, 2) };
}

/** Flags -> Microcks `FeaturesConfig` (`enabled` as a string, as Microcks serves it) + the demo extension. */
export function toFeaturesConfig(flags: readonly FeatureFlag[]): MicrocksFeaturesConfig {
  const config: MicrocksFeaturesConfig = {};
  for (const flag of flags) {
    const feature = FLAG_FEATURE[flag.id];
    if (feature) config[feature] = { enabled: String(flag.enabled) };
  }
  config.demo = { flags: flags.map((f) => ({ ...f })) };
  return config;
}

/**
 * `FeaturesConfig` + `KeycloakConfig` -> the flags of the Configuration tab, their state always from Microcks (each
 * feature's `enabled`, Keycloak's `enabled`). With the demo extension, its flags give the list, labels and values;
 * without it (a real Microcks), one flag per feature of the config, then Keycloak.
 */
export function toFeatureFlags(config: MicrocksFeaturesConfig, keycloak: Pick<MicrocksKeycloakConfig, 'enabled'> & Partial<MicrocksKeycloakConfig>): FeatureFlag[] {
  const demoFlags = config.demo?.flags;
  if (!demoFlags) {
    const features = Object.entries(config).filter((entry): entry is [string, MicrocksFeature] => entry[0] !== 'demo' && typeof entry[1] === 'object' && entry[1] !== null);
    return [...features.map(([name, feature]) => toMicrocksFeatureFlag(name, feature)), toKeycloakFlag(keycloak)];
  }
  return demoFlags.map((flag) => {
    const featureName = FLAG_FEATURE[flag.id];
    const feature = featureName ? (config[featureName] as MicrocksFeature | undefined) : undefined;
    if (feature?.enabled !== undefined) return { ...flag, enabled: feature.enabled === 'true' };
    if (flag.id === KEYCLOAK_FLAG) return { ...flag, enabled: keycloak.enabled };
    return { ...flag };
  });
}

/** One feature of a real Microcks `FeaturesConfig` (`microcks-hub: { enabled: "true", endpoint: ... }`) as a flag. */
function toMicrocksFeatureFlag(name: string, feature: MicrocksFeature): FeatureFlag {
  const id = Object.keys(FLAG_FEATURE).find((flagId) => FLAG_FEATURE[flagId] === name) ?? name;
  const { label, description } = FEATURE_LABELS[name] ?? { label: name, description: '' };
  const enabled = feature.enabled === 'true';
  const settings = Object.entries(feature).filter(([key]) => key !== 'enabled');
  return {
    id,
    label,
    description,
    enabled,
    value: settings.length > 0 ? settings.map(([key, value]) => `${key} ${value}`).join(' · ') : '—',
    key: `features.feature.${name}.enabled=${enabled}`,
  };
}

function toKeycloakFlag(keycloak: Pick<MicrocksKeycloakConfig, 'enabled'> & Partial<MicrocksKeycloakConfig>): FeatureFlag {
  const value = [keycloak.realm && `realm ${keycloak.realm}`, keycloak.resource && `client ${keycloak.resource}`, keycloak['auth-server-url']].filter(Boolean).join(' · ');
  return { id: KEYCLOAK_FLAG, ...KEYCLOAK_LABEL, enabled: keycloak.enabled, value: value || '—', key: `keycloak.enabled=${keycloak.enabled}` };
}

/** The demo's `{ created, replaced }` answer of `POST /api/import`, or undefined (a real Microcks answers 201 without a body). */
export function readSnapshotImportResult(body: unknown): DemoSnapshotImportResult | undefined {
  const demo = body as Partial<DemoSnapshotImportResult> | null | undefined;
  return typeof demo?.created === 'number' && typeof demo.replaced === 'number' ? { created: demo.created, replaced: demo.replaced } : undefined;
}

/** Summary of an import answered without a body: the services created are the growth of the catalogue, the replaced ones are unknown (0). */
export function toSnapshotImportResult(servicesBefore: number, servicesAfter: number): DemoSnapshotImportResult {
  return { created: Math.max(0, servicesAfter - servicesBefore), replaced: 0 };
}
