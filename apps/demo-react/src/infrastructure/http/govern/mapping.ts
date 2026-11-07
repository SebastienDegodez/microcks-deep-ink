/**
 * Govern DTOs <-> domain. Both directions live here: the HTTP adapters read the DTOs, the MSW handlers
 * (`src/infrastructure/msw/handlers/govern.ts`) write them from the in-memory adapters.
 */
import type { AdminGroup, AdminUser, FeatureFlag, Role, Snapshot } from '@/domain/govern';
import {
  FLAG_FEATURE,
  KEYCLOAK_FLAG,
  ROLES,
  SNAPSHOT_FILE_NAME,
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
 * `FeaturesConfig` + `KeycloakConfig` -> the flags of the Configuration tab: their labels come from the demo
 * extension, their state from Microcks (each feature's `enabled`, Keycloak's `enabled`).
 */
export function toFeatureFlags(config: MicrocksFeaturesConfig, keycloak: Pick<MicrocksKeycloakConfig, 'enabled'>): FeatureFlag[] {
  return (config.demo?.flags ?? []).map((flag) => {
    const featureName = FLAG_FEATURE[flag.id];
    const feature = featureName ? (config[featureName] as MicrocksFeature | undefined) : undefined;
    if (feature?.enabled !== undefined) return { ...flag, enabled: feature.enabled === 'true' };
    if (flag.id === KEYCLOAK_FLAG) return { ...flag, enabled: keycloak.enabled };
    return { ...flag };
  });
}
