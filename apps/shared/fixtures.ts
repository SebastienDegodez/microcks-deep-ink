// Realistic Microcks data shared by the React and Angular Storybooks.
import type {
  CommandItem,
  OperationResult,
  TableColumn,
  TabItem,
  WorkflowGoto,
  WorkflowSource,
  WorkflowStep,
  WorkflowThread,
} from '@microcks-deep-ink/core';

export const MOCK_BASE = 'http://microcks.local:8080/rest/API+Pastry/2.0';

export const OPERATIONS = [
  { method: 'GET', path: '/pastries', meta: '1 example · 312 calls / 24 h' },
  { method: 'GET', path: '/pastries/{name}', meta: '3 examples · URI_PARTS', mockUrl: `${MOCK_BASE}/pastries/Millefeuille` },
  { method: 'PATCH', path: '/pastries/{name}', meta: '2 examples · URI_PARTS' },
  { method: 'POST', path: '/pastries', meta: '1 example · JSON_BODY' },
];

export const CONFORMANCE: OperationResult[] = [
  'pass', 'pass', 'pass', 'pass', 'pass', 'fail', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass',
];

export const SERVICE_TABS: TabItem[] = [
  { id: 'operations', label: 'Operations', count: 4 },
  { id: 'examples', label: 'Examples', count: 9 },
  { id: 'tests', label: 'Tests', count: 27 },
  { id: 'contracts', label: 'Contracts', count: 2 },
  { id: 'agent', label: 'Agent-ready' },
];

export const COMMANDS: CommandItem[] = [
  { id: 'test-pastry', label: 'Run a test on API Pastry 2.0', kind: 'action', keywords: ['test', 'run', 'pastry'] },
  { id: 'import', label: 'Import a contract', kind: 'action', keywords: ['import', 'upload'] },
  { id: 'copy-url', label: 'Copy mock URL of API Pastry 2.0', kind: 'action', keywords: ['copy', 'pastry'] },
  { id: 'svc-pastry', label: 'Open API Pastry 2.0', kind: 'service', protocol: 'REST', hint: 'service', keywords: ['pastry'] },
  { id: 'svc-orders', label: 'Open Pastry orders API 0.1.0', kind: 'service', protocol: 'EVENT', hint: 'service', keywords: ['pastry', 'kafka'] },
  { id: 'svc-hello', label: 'Open HelloService v1', kind: 'service', protocol: 'gRPC', hint: 'service' },
  { id: 'svc-movie', label: 'Open Movie Graph 1.0', kind: 'service', protocol: 'GRAPHQL', hint: 'service' },
];

export const CATALOGUE_COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Service' },
  { key: 'version', label: 'Version', mono: true },
  { key: 'type', label: 'Type' },
  { key: 'operations', label: 'Operations', align: 'end' },
  { key: 'conformance', label: 'Conformance', align: 'end' },
  { key: 'updated', label: 'Updated' },
];

export const CATALOGUE_ROWS = [
  { id: 'pastry', name: 'API Pastry', version: '2.0', type: 'REST', operations: 4, conformance: '92%', updated: '2 h ago' },
  { id: 'orders', name: 'Pastry orders API', version: '0.1.0', type: 'EVENT', operations: 2, conformance: '100%', updated: 'yesterday' },
  { id: 'hello-grpc', name: 'HelloService', version: 'v1', type: 'gRPC', operations: 1, conformance: '—', updated: '3 days ago' },
  { id: 'movie', name: 'Movie Graph', version: '1.0', type: 'GRAPHQL', operations: 5, conformance: '64%', updated: 'last week' },
  { id: 'hello-soap', name: 'HelloService', version: '0.9', type: 'SOAP', operations: 2, conformance: '41%', updated: 'last month' },
];

export const LOOM_SOURCES: WorkflowSource[] = [
  { name: 'apiPastry', protocol: 'REST' },
  { name: 'pastryOrders', protocol: 'EVENT' },
];

export const LOOM_STEPS: WorkflowStep[] = [
  { stepId: 'listPastries', source: 'apiPastry', operation: 'GET /pastries', criteria: 'pass', contract: 'pass' },
  { stepId: 'getPastry', source: 'apiPastry', operation: 'GET /pastries/{name}', criteria: 'pass', contract: 'pass' },
  { stepId: 'patchPastry', source: 'apiPastry', operation: 'PATCH /pastries/{name}', criteria: 'pass', contract: 'fail', retry: 'retry ×2 · 1 s' },
  { stepId: 'awaitRestock', source: 'pastryOrders', operation: 'SUBSCRIBE pastry-restocked', criteria: 'pending', contract: 'pending' },
];

export const LOOM_THREADS: WorkflowThread[] = [
  { from: 'listPastries', to: 'getPastry', expression: '$steps.listPastries.outputs.firstName → name' },
  { from: 'getPastry', to: 'patchPastry', expression: '$steps.getPastry.outputs.price → price' },
  { from: 'patchPastry', to: 'awaitRestock', expression: '$steps.patchPastry.outputs.name → key' },
];

export const LOOM_GOTOS: WorkflowGoto[] = [{ from: 'patchPastry', to: 'getPastry' }];

/** Design tokens grouped for the Foundations pages. */
export const COLOR_GROUPS: Array<{ title: string; tokens: string[] }> = [
  { title: 'Ink ground', tokens: ['bg', 'canvas', 'surface', 'raised', 'border', 'border-strong'] },
  { title: 'Text', tokens: ['text', 'text-secondary', 'text-muted'] },
  { title: 'Action & links', tokens: ['action', 'on-action', 'link', 'selected', 'focus-ring'] },
  { title: 'Outcomes', tokens: ['success', 'danger', 'warning', 'running', 'on-status'] },
  { title: 'Live', tokens: ['live', 'live-text'] },
  { title: 'Protocols', tokens: ['proto-rest', 'proto-soap', 'proto-event', 'proto-grpc', 'proto-graphql', 'proto-direct', 'on-proto'] },
  { title: 'Brand (theme-independent)', tokens: ['brand-blue', 'brand-cloud', 'brand-deep', 'brand-pink', 'brand-ink'] },
];

export const TYPE_STYLES = [
  { name: 'display', sample: 'API Pastry', note: 'Alegreya Sans SC 800 · 44/48 · one per screen' },
  { name: 'section', sample: 'Operations', note: 'Alegreya Sans SC 700 · 28/32 · page title' },
  { name: 'title', sample: 'Mock URL', note: 'IBM Plex Sans 600 · 20/28 · panel title' },
  { name: 'heading', sample: 'Examples', note: 'IBM Plex Sans 600 · 16/22' },
  { name: 'body', sample: 'Returns the requested pastry.', note: 'IBM Plex Sans 400 · 15/22' },
  { name: 'small', sample: 'Updated 2 h ago', note: 'IBM Plex Sans 400 · 13/18' },
  { name: 'label', sample: 'DISPATCHER', note: 'IBM Plex Sans 600 · 12/16 · +0.04em' },
  { name: 'code', sample: 'GET /pastries/{name}', note: 'JetBrains Mono 400 · 13/20' },
  { name: 'badge', sample: 'REST', note: 'JetBrains Mono 600 · 12/16' },
];

export const SPACING = ['space-1', 'space-2', 'space-3', 'space-4', 'space-6', 'space-8', 'space-12'];
export const RADII = ['radius-control', 'radius-badge', 'radius-panel', 'radius-node', 'radius-pill'];

/** A sample marketplace plugin used by the Plugins stories. */
export const SAMPLE_MANIFEST = {
  schemaVersion: 1 as const,
  id: 'io.github.acme.kafka-replay',
  name: 'Kafka Replay',
  version: '0.3.0',
  description: 'Replays recorded Kafka traffic against an AsyncAPI mock.',
  publisher: { name: 'ACME' },
  microcks: '>=2.0.0 <3.0.0',
  categories: ['observability' as const],
  protocols: ['EVENT' as const],
  backend: {
    artifact: 'ghcr.io/acme/microcks-kafka-replay:0.3.0',
    extensions: [{ point: 'test-runner' as const, id: 'kafka-replay', protocols: ['EVENT' as const] }],
  },
  frontend: {
    entry: './kafka-replay.js',
    tagPrefix: 'acme-',
    contributes: ['nav.items' as const, 'service.tabs' as const, 'cockpit.widgets' as const],
  },
};
