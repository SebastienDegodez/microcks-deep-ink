import type { AdminGroup, AdminUser, FeatureFlag, HubPackage, MembershipRequest } from '@/domain/govern';
import { NotFoundError } from '@/application/shared';
import type { AdminRepository, HubRepository } from '@/application/ports/govern';
import { SERVICES, after, type InMemoryDeps } from '../shared';

export interface GovernAdapters {
  hub: HubRepository;
  admin: AdminRepository;
}

const PACKAGES: HubPackage[] = [
  { id: 'banking', name: 'Banking APIs', category: 'Finance', description: 'Accounts, payments and cards sample APIs.', versions: ['1.2.0', '1.1.0'], apiCount: 4, installed: false },
  { id: 'api-pastry', name: 'API Pastry', category: 'Samples', description: 'The pastry shop API used in the Microcks tutorials.', versions: ['2.0', '1.0'], apiCount: 2, installed: true },
  { id: 'petstore', name: 'Petstore', category: 'Samples', description: 'The classic OpenAPI petstore.', versions: ['1.0.0'], apiCount: 1, installed: false },
  { id: 'movie-graph', name: 'Movie Graph', category: 'Samples', description: 'GraphQL movies and reviews.', versions: ['1.0'], apiCount: 1, installed: false },
];

const USERS: AdminUser[] = [
  { id: 'ma', name: 'Maya Alvarez', email: 'maya@acme.io', role: 'admin', groups: ['platform'] },
  { id: 'jb', name: 'Jonas Bauer', email: 'jonas@acme.io', role: 'manager', groups: ['bakery'] },
  { id: 'lc', name: 'Lina Chen', email: 'lina@acme.io', role: 'user', groups: ['bakery', 'platform'] },
  { id: 'pd', name: 'Paul Dupont', email: 'paul@acme.io', role: 'user', groups: [] },
];

const GROUPS: AdminGroup[] = [
  { id: 'platform', name: 'platform', members: ['ma', 'lc'], pendingRequests: 0 },
  { id: 'bakery', name: 'bakery', members: ['jb', 'lc'], pendingRequests: 2 },
];

const REQUESTS: MembershipRequest[] = [
  { id: 'req-1', groupId: 'bakery', userId: 'pd', requestedAt: '2026-11-03T08:40:04Z' },
  { id: 'req-2', groupId: 'bakery', userId: 'ma', requestedAt: '2026-11-02T14:00:04Z' },
];

const FLAGS: FeatureFlag[] = [
  { id: 'ai-copilot', label: 'AI Copilot', description: 'Generate examples with the AI Copilot.', enabled: true },
  { id: 'arazzo', label: 'Arazzo workflows', description: 'Import, run and verify Arazzo workflows.', enabled: true },
  { id: 'mcp', label: 'MCP exposure', description: 'Expose services as MCP tools.', enabled: true },
];

export function createInMemoryGovernAdapters(_deps: InMemoryDeps = {}): GovernAdapters {
  const packages = PACKAGES.map((p) => ({ ...p }));
  const users = USERS.map((u) => ({ ...u }));
  const groups = GROUPS.map((g) => ({ ...g }));
  const requests = REQUESTS.map((r) => ({ ...r }));
  const flags = FLAGS.map((f) => ({ ...f }));

  const hub: HubRepository = {
    list: (filter = {}) =>
      after(() => {
        const q = (filter.query ?? '').trim().toLowerCase();
        return packages.filter((p) => (!q || `${p.name} ${p.description}`.toLowerCase().includes(q)) && (!filter.category || p.category === filter.category));
      }),
    categories: () =>
      after(() => {
        const map = new Map<string, number>();
        for (const p of packages) map.set(p.category, (map.get(p.category) ?? 0) + 1);
        return [...map].map(([name, count]) => ({ name, count }));
      }),
    get: (id) => after(() => packages.find((p) => p.id === id)),
    install: (id) =>
      after(() => {
        const found = packages.find((p) => p.id === id);
        if (!found) throw new NotFoundError('Package', id);
        found.installed = true;
        return { ...found };
      }),
  };

  const admin: AdminRepository = {
    users: () => after(() => users.map((u) => ({ ...u }))),
    setRole: (userId, role) =>
      after(() => {
        const found = users.find((u) => u.id === userId);
        if (!found) throw new NotFoundError('User', userId);
        found.role = role;
        return { ...found };
      }),
    groups: () => after(() => groups.map((g) => ({ ...g, pendingRequests: requests.filter((r) => r.groupId === g.id).length }))),
    saveMembers: (groupId, members) =>
      after(() => {
        const found = groups.find((g) => g.id === groupId);
        if (!found) throw new NotFoundError('Group', groupId);
        found.members = members;
        return { ...found };
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
    snapshot: (serviceIds) =>
      after(() => ({
        fileName: 'microcks-snapshot.json',
        serviceIds,
        json: JSON.stringify({ services: SERVICES.filter((s) => serviceIds.includes(s.id)).map((s) => ({ id: s.id, name: s.name, version: s.version })) }, null, 2),
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
