// Realistic Microcks data shared by the React and Angular Storybooks.
// Types come from the registry sources (the code users copy), never from a published package.
import type { OperationResult } from '@microcks-deep-ink/registry/react/conformance-band';
import type { TabItem } from '@microcks-deep-ink/registry/react/tabs';
import type { CommandItem } from '@microcks-deep-ink/registry/react/command-bar';
import type { LoomSource, LoomStep, LoomThread } from '@microcks-deep-ink/registry/react/workflow-loom';

/** Props of the <WorkflowLoom> element wrapper, minus the callbacks. */
export interface LoomScenario {
  label: string;
  sources: LoomSource[];
  steps: LoomStep[];
  threads: LoomThread[];
  inputs?: string[];
  outputs?: string[];
  validatesSchemas?: boolean;
}

export interface CatalogueRow {
  id: string;
  name: string;
  version: string;
  type: string;
  operations: number;
  conformance: string;
  updated: string;
}

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

export const CATALOGUE_COLUMNS: Array<{ key: keyof CatalogueRow & string; header: string; align?: 'start' | 'end'; mono?: boolean; sortable?: boolean }> = [
  { key: 'name', header: 'Service', sortable: true },
  { key: 'version', header: 'Version', mono: true },
  { key: 'type', header: 'Type', sortable: true },
  { key: 'operations', header: 'Operations', align: 'end', sortable: true },
  { key: 'conformance', header: 'Conformance', align: 'end' },
  { key: 'updated', header: 'Updated' },
];

export const CATALOGUE_ROWS: CatalogueRow[] = [
  { id: 'pastry', name: 'API Pastry', version: '2.0', type: 'REST', operations: 4, conformance: '92%', updated: '2 h ago' },
  { id: 'orders', name: 'Pastry orders API', version: '0.1.0', type: 'EVENT', operations: 2, conformance: '100%', updated: 'yesterday' },
  { id: 'hello-grpc', name: 'HelloService', version: 'v1', type: 'gRPC', operations: 1, conformance: '—', updated: '3 days ago' },
  { id: 'movie', name: 'Movie Graph', version: '1.0', type: 'GRAPHQL', operations: 5, conformance: '64%', updated: 'last week' },
  { id: 'hello-soap', name: 'HelloService', version: '0.9', type: 'SOAP', operations: 2, conformance: '41%', updated: 'last month' },
];

/**
 * Run #14 of the `restock-pastry` workflow, as the Arazzo POC reports it:
 * - no goto: only `retry` and `end` actions;
 * - `patchPastry` fails its Schema validation (the response price is the string "3.9"), is retried twice
 *   after 1 s, and fails after 3 attempts;
 * - `verifyPastry` never runs.
 */
export const LOOM_RESTOCK_RUN14: LoomScenario = {
  label: 'restock-pastry, run #14',
  validatesSchemas: true,
  inputs: ['pastryName', 'newPrice'],
  outputs: ['restocked'],
  sources: [{ name: 'apiPastry', type: 'openapi', protocol: 'REST', linked: true }],
  steps: [
    {
      stepId: 'listPastries',
      source: 'apiPastry',
      operation: 'GET /pastries',
      status: 'passed',
      attempts: 1,
      checks: { successCriteria: 'passed', schemaValidation: 'passed' },
    },
    {
      stepId: 'getPastry',
      source: 'apiPastry',
      operation: 'GET /pastries/{name}',
      status: 'passed',
      attempts: 1,
      checks: { successCriteria: 'passed', schemaValidation: 'passed' },
      actions: [
        {
          type: 'end',
          name: 'alreadyAvailable',
          on: 'success',
          criteria: "$response.body#/status == 'available'",
          taken: false,
        },
      ],
    },
    {
      stepId: 'patchPastry',
      source: 'apiPastry',
      operation: 'PATCH /pastries/{name}',
      status: 'failed',
      attempts: 3,
      checks: { successCriteria: 'passed', schemaValidation: 'failed' },
      actions: [{ type: 'retry', name: 'retryPatch', on: 'failure', retryAfter: 1, retryLimit: 2, applied: true }],
    },
    {
      stepId: 'verifyPastry',
      source: 'apiPastry',
      operation: 'GET /pastries/{name}',
      status: 'not-run',
      checks: { successCriteria: 'not-evaluated', schemaValidation: 'not-evaluated' },
    },
  ],
  threads: [
    { from: '$inputs', to: 'getPastry', expression: '$inputs.pastryName → name' },
    { from: 'listPastries', to: 'getPastry', expression: '$steps.listPastries.outputs.firstName → name' },
    { from: '$inputs', to: 'patchPastry', expression: '$inputs.newPrice → body.price' },
    { from: 'patchPastry', to: 'verifyPastry', expression: '$steps.patchPastry.outputs.name → name' },
    { from: 'verifyPastry', to: '$outputs', expression: '$steps.verifyPastry.outputs.status → restocked' },
  ],
};

/** The failing response of `patchPastry` in run #14: price is a string, the schema wants a number. */
export const RUN14_FAILURE = {
  request: 'PATCH /pastries/Millefeuille',
  response: [
    { text: '{' },
    { text: '  "name": "Millefeuille",' },
    { text: '  "size": "L",' },
    { text: '  "price": "3.9",', bad: true, note: 'Expected number, got string' },
    { text: '  "status": "available"' },
    { text: '}' },
  ],
  summary: 'Success criteria passed (HTTP 200) but Schema validation failed: /price must be number. Retried twice after 1 s, failed after 3 attempts. verifyPastry did not run.',
};

/** `check-menu`: three independent reads run in parallel (dependsOn branches) and join at compareSizes. */
export const LOOM_CHECK_MENU: LoomScenario = {
  label: 'check-menu',
  validatesSchemas: true,
  inputs: ['pastryNames'],
  outputs: ['report'],
  sources: [
    { name: 'apiPastry', type: 'openapi', protocol: 'REST', linked: true },
    { name: 'bakeryApi', type: 'openapi', protocol: 'REST', linked: true },
  ],
  steps: [
    {
      stepId: 'getCroissant',
      source: 'apiPastry',
      operation: 'GET /pastries/{name}',
      status: 'passed',
      attempts: 1,
      checks: { successCriteria: 'passed', schemaValidation: 'passed' },
    },
    {
      stepId: 'getEclair',
      source: 'apiPastry',
      operation: 'GET /pastries/{name}',
      status: 'passed',
      attempts: 1,
      checks: { successCriteria: 'passed', schemaValidation: 'passed' },
    },
    {
      stepId: 'getBaguette',
      source: 'bakeryApi',
      operation: 'GET /breads/{name}',
      status: 'passed',
      attempts: 1,
      checks: { successCriteria: 'passed', schemaValidation: 'passed' },
    },
    {
      stepId: 'compareSizes',
      source: 'apiPastry',
      operation: 'POST /pastries/compare',
      dependsOn: ['getCroissant', 'getEclair', 'getBaguette'],
      status: 'passed',
      attempts: 1,
      checks: { successCriteria: 'passed', schemaValidation: 'passed' },
    },
  ],
  threads: [
    { from: '$inputs', to: 'getCroissant', expression: '$inputs.pastryNames[0] → name' },
    { from: '$inputs', to: 'getEclair', expression: '$inputs.pastryNames[1] → name' },
    { from: '$inputs', to: 'getBaguette', expression: '$inputs.pastryNames[2] → name' },
    { from: 'getCroissant', to: 'compareSizes', expression: '$steps.getCroissant.outputs.size → a' },
    { from: 'getEclair', to: 'compareSizes', expression: '$steps.getEclair.outputs.size → b' },
    { from: 'getBaguette', to: 'compareSizes', expression: '$steps.getBaguette.outputs.size → c' },
    { from: 'compareSizes', to: '$outputs', expression: '$steps.compareSizes.outputs.report → report' },
  ],
};

/** Design tokens grouped for the Foundations pages. */
export const COLOR_GROUPS: Array<{ title: string; tokens: string[] }> = [
  { title: 'Ink ground', tokens: ['bg', 'canvas', 'surface', 'raised', 'border', 'border-strong', 'border-control'] },
  { title: 'Text', tokens: ['text', 'text-secondary', 'text-muted'] },
  { title: 'Action & links', tokens: ['action', 'on-action', 'link', 'selected', 'focus-ring'] },
  { title: 'Outcomes', tokens: ['success', 'danger', 'warning', 'running', 'on-status', 'success-tint', 'danger-tint', 'warning-tint', 'info-tint'] },
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
