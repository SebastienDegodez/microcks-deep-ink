import type { AdminGroup, AdminUser, FeatureFlag, MembershipRequest, SnapshotImportPreviewItem } from '@/domain/govern';

export const USERS: Omit<AdminUser, 'groups'>[] = [
  { id: 'admin', name: 'Microcks Admin', email: 'admin@microcks.local', role: 'admin', initials: 'MA', self: true },
  { id: 'manager', name: 'Default Manager', email: 'manager@microcks.local', role: 'manager', initials: 'DM' },
  { id: 'user', name: 'Default User', email: 'user@microcks.local', role: 'user', initials: 'DU' },
  { id: 'clara.nguyen', name: 'Clara Nguyen', email: 'clara.nguyen@microcks.local', role: 'manager', initials: 'CN' },
  { id: 'yanis.benali', name: 'Yanis Benali', email: 'yanis.benali@microcks.local', role: 'manager', initials: 'YB' },
  { id: 'tom.keller', name: 'Tom Keller', email: 'tom.keller@microcks.local', role: 'manager', initials: 'TK' },
  { id: 'lea.martin', name: 'Léa Martin', email: 'lea.martin@microcks.local', role: 'user', initials: 'LM' },
];

/** Groups are the values of the master label `domain` (repository tenancy). */
export const GROUPS: Omit<AdminGroup, 'pendingRequests'>[] = [
  { id: 'pastry', name: '/microcks/manager/pastry', members: ['clara.nguyen', 'tom.keller'], services: ['API Pastry 2.0', 'API Pastry 1.0', 'Pastry orders API 0.1.0'] },
  { id: 'movies', name: '/microcks/manager/movies', members: ['yanis.benali'], services: ['Movie Graph API 1.0'] },
  { id: 'pets', name: '/microcks/manager/pets', members: ['tom.keller'], services: ['Petstore API 1.0.0'] },
  { id: 'users', name: '/microcks/manager/users', members: ['yanis.benali'], services: ['User signed-up API 0.1.1'] },
  { id: 'legacy', name: '/microcks/manager/legacy', members: ['manager'], services: ['HelloService Mock 0.9'] },
  { id: 'beer', name: '/microcks/manager/beer', members: [], services: ['Beer Catalog API 0.9'] },
];

export const REQUESTS: MembershipRequest[] = [
  { id: 'req-1', groupId: 'beer', userId: 'clara.nguyen', requestedAt: '2026-11-03T08:40:04Z' },
  { id: 'req-2', groupId: 'legacy', userId: 'tom.keller', requestedAt: '2026-11-02T14:00:04Z' },
];

export const FLAGS: FeatureFlag[] = [
  { id: 'async-api', label: 'Async API mocking', description: 'Event mocks published on brokers', enabled: true, value: 'Kafka kafka.local:9092 · WebSocket :8081', key: 'features.feature.async-api.enabled=true' },
  { id: 'ai-copilot', label: 'AI Copilot', description: 'Example generation from the contract', enabled: true, value: 'openai · model gpt-4o-mini · timeout 30 s · maxTokens 3000', key: 'ai-copilot.enabled=true · ai-copilot.openai.model=gpt-4o-mini' },
  { id: 'mcp', label: 'MCP endpoints', description: 'Each Service exposed as an MCP server', enabled: true, value: '/mcp/{service}/{version} · SSE + Streamable HTTP', key: 'built in' },
  { id: 'keycloak', label: 'Keycloak authentication', description: 'Identity, roles and groups', enabled: true, value: 'realm microcks · client microcks-app · http://keycloak.local:8180', key: 'keycloak.enabled=true · keycloak.realm=microcks' },
  { id: 'tenancy', label: 'Repository tenancy', description: 'Manager groups per master label value', enabled: true, value: 'master label domain · 6 groups', key: 'features.feature.repository-tenancy.enabled=true' },
  { id: 'hub', label: 'Microcks Hub', description: 'Browse and install API mocks from the Hub', enabled: true, value: 'https://hub.microcks.io', key: 'features.feature.microcks-hub.enabled=true' },
  { id: 'filter', label: 'Repository filter', description: 'Filter the catalogue by a label', enabled: false, value: '—', key: 'features.feature.repository-filter.enabled=false' },
];

export const SNAPSHOT_IMPORT_PREVIEW: SnapshotImportPreviewItem[] = [
  { name: 'Petstore API 1.0.0', protocol: 'REST', effect: 'already exists · will be replaced', kind: 'replace' },
  { name: 'Beer Catalog API 0.9', protocol: 'REST', effect: 'already exists · will be replaced', kind: 'replace' },
  { name: 'Order Tracking API 1.0', protocol: 'REST', effect: 'new · 2 operations, 5 examples', kind: 'new' },
];
