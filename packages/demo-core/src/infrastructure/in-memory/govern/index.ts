import type { AdminGroup, AdminUser, FeatureFlag, HubPackage, MembershipRequest } from '../../../domain/govern/index.js';
import { NotFoundError } from '../../../application/shared/index.js';
import type { AdminRepository, HubRepository } from '../../../application/ports/govern.js';
import { SERVICES, after, isFastMode, type InMemoryDeps } from '../shared/index.js';
import { setTimeout } from '../shared/timers.js';
import { FLAGS, GROUPS, REQUESTS, SNAPSHOT_IMPORT_PREVIEW, SNAPSHOT_SERVICE_ORDER, USERS } from './seed/admin.seed.js';
import { CATEGORY_ORDER, seedPackages } from './seed/hub.seed.js';

export interface GovernAdapters {
  hub: HubRepository;
  admin: AdminRepository;
}

const INSTALL_MS = 2200;
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createInMemoryGovernAdapters(_deps: InMemoryDeps = {}): GovernAdapters {
  const packages: HubPackage[] = seedPackages();
  const users = USERS.map((u) => ({ ...u }));
  const groups = GROUPS.map((g) => ({ ...g, members: [...g.members] }));
  const requests: MembershipRequest[] = REQUESTS.map((r) => ({ ...r }));
  const flags: FeatureFlag[] = FLAGS.map((f) => ({ ...f }));

  const withGroups = (u: Omit<AdminUser, 'groups'>): AdminUser => ({ ...u, groups: groups.filter((g) => g.members.includes(u.id)).map((g) => g.id) });
  const withPending = (g: Omit<AdminGroup, 'pendingRequests'>): AdminGroup => ({
    ...g,
    members: [...g.members],
    pendingRequests: requests.filter((r) => r.groupId === g.id).length,
  });

  const hub: HubRepository = {
    list: (filter = {}) =>
      after(() => {
        const q = (filter.query ?? '').trim().toLowerCase();
        return packages
          .filter((p) => {
            const haystack = [p.name, p.description, p.category, ...(p.apis ?? []).map((a) => `${a.protocol} ${a.name} ${a.versions.join(' ')}`)].join(' ').toLowerCase();
            return (!q || haystack.includes(q)) && (!filter.category || p.category === filter.category);
          })
          .map((p) => ({ ...p }));
      }),
    categories: () =>
      after(() => {
        const map = new Map<string, number>();
        for (const p of packages) map.set(p.category, (map.get(p.category) ?? 0) + 1);
        return [...map]
          .sort((a, b) => CATEGORY_ORDER.indexOf(a[0]) - CATEGORY_ORDER.indexOf(b[0]))
          .map(([name, count]) => ({ name, count }));
      }),
    get: (id) => after(() => packages.find((p) => p.id === id)),
    install: async (id) => {
      const found = packages.find((p) => p.id === id);
      if (!found) throw new NotFoundError('Package', id);
      // The prototype "installs" for about two seconds; the page shows a progress bar meanwhile.
      if (!isFastMode()) await wait(INSTALL_MS);
      found.installed = true;
      return { ...found };
    },
  };

  const admin: AdminRepository = {
    users: () => after(() => users.map(withGroups)),
    setRole: (userId, role) =>
      after(() => {
        const found = users.find((u) => u.id === userId);
        if (!found) throw new NotFoundError('User', userId);
        found.role = role;
        return withGroups(found);
      }),
    groups: () => after(() => groups.map(withPending)),
    saveMembers: (groupId, members) =>
      after(() => {
        const found = groups.find((g) => g.id === groupId);
        if (!found) throw new NotFoundError('Group', groupId);
        found.members = [...members];
        return withPending(found);
      }),
    requests: () => after(() => requests.map((r) => ({ ...r }))),
    approveRequest: (id) =>
      after(() => {
        const at = requests.findIndex((r) => r.id === id);
        const req = requests[at];
        if (!req) throw new NotFoundError('Request', id);
        requests.splice(at, 1);
        const group = groups.find((g) => g.id === req.groupId);
        if (group && !group.members.includes(req.userId)) group.members = [...group.members, req.userId];
      }),
    snapshotServices: () =>
      after(() =>
        SNAPSHOT_SERVICE_ORDER.map((id) => SERVICES.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => s !== undefined).map((s) => ({ ...s })),
      ),
    snapshot: (serviceIds) =>
      after(() => {
        const selected = SERVICES.filter((s) => serviceIds.includes(s.id));
        const operations = selected.reduce((n, s) => n + s.operationCount, 0);
        return {
          fileName: 'microcks-repository.json',
          serviceIds,
          operations,
          // The prototype's estimate: 4 KB of envelope and about 6 KB per operation.
          sizeKb: 4 + operations * 6,
          json: JSON.stringify(
            { exportedAt: '2026-11-03T09:10:04Z', services: selected.map((s) => ({ id: s.id, name: s.name, version: s.version, operations: s.operationCount })) },
            null,
            2,
          ),
        };
      }),
    snapshotImportPreview: () => after(() => SNAPSHOT_IMPORT_PREVIEW.map((p) => ({ ...p }))),
    importSnapshot: () =>
      after(() => ({
        created: SNAPSHOT_IMPORT_PREVIEW.filter((p) => p.kind === 'new').length,
        replaced: SNAPSHOT_IMPORT_PREVIEW.filter((p) => p.kind === 'replace').length,
      })),
    flags: () => after(() => flags.map((f) => ({ ...f }))),
    setFlag: (id, enabled) =>
      after(() => {
        const found = flags.find((f) => f.id === id);
        if (!found) throw new NotFoundError('Flag', id);
        found.enabled = enabled;
        return { ...found };
      }),
  };
  return { hub, admin };
}
