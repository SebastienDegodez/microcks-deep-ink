import { clockTime, traceIds, type FlowCounts, type TraceCall, type TraceKind, type TraceTopology } from '../../domain/observe/index.js';
import { plural } from '../shared/format.js';

/** Calls the stream keeps, newest first. */
export const MAX_CALLS = 60;

/** Rows the list shows at most. */
export const MAX_ROWS = 12;

/** How long the latest call stays in the live colour, in ms. */
export const FLASH_MS = 1400;

const REST_BASE = '/rest/API+Pastry/2.0';

/** Description of the page header. */
export const TRACES_DESCRIPTION =
  'Real-time calls hitting your mocks, from REST and Kafka endpoints to MCP tool calls made by AI agents. Each call shows who called, which operation answered, which example the dispatcher picked and, for calls of an Arazzo run or session, the workflow step it belongs to.';

/** Topology until the query answers: no node, no edge, no call. */
export const EMPTY_TOPOLOGY: TraceTopology = {
  clients: [],
  endpoints: [],
  examples: [],
  clientEdges: [],
  exampleEdges: [],
  history: [],
};

/** Value of the Protocol filter: every protocol, or one. */
export type KindFilter = '' | Extract<TraceKind, 'REST' | 'MCP' | 'EVENT'>;

/** Value of the Status filter: every status, the answered calls, or the misses. */
export type StatusFilter = '' | 'ok' | 'error';

/** Background of the method chip: events and writes in the event colour, MCP in the link colour. */
export function methodTone(c: Pick<TraceCall, 'kind' | 'method'>): 'event' | 'mcp' | 'rest' {
  if (c.kind === 'EVENT') return 'event';
  if (c.kind === 'MCP') return 'mcp';
  return c.method === 'PATCH' || c.method === 'PUT' || c.method === 'POST' ? 'event' : 'rest';
}

/** Arazzo step of the call, from its baggage. */
export const arazzoStep = (c: TraceCall) => (c.baggage ? /microcks-arazzo-step=([^,;\s]+)/.exec(c.baggage)?.[1] : undefined);

/** Arazzo workflow id of the call, from its baggage. */
export const arazzoWorkflow = (c: TraceCall) => (c.baggage ? /microcks-arazzo-workflow=([^,;\s]+)/.exec(c.baggage)?.[1] : undefined);

/** Arazzo attempt of the call, from its baggage. */
export const arazzoAttempt = (c: TraceCall) => (c.baggage ? /microcks-arazzo-attempt=(\d+)/.exec(c.baggage)?.[1] : undefined);

/** Arazzo run id of the call, from its baggage. */
export const arazzoRunId = (c: TraceCall) => (c.baggage ? /microcks-arazzo-run=([^,;\s]+)/.exec(c.baggage)?.[1] : undefined);

/** The Arazzo run of the call in words: workflow, run, step and attempt. */
export const arazzoTitle = (c: TraceCall) =>
  `From workflow ${c.workflowName ?? arazzoWorkflow(c) ?? ''} · run #${c.arazzoRun ?? ''} · step ${arazzoStep(c) ?? ''} · attempt ${arazzoAttempt(c) ?? '1'}`;

/** Title of the call detail: the path without the REST base, the MCP tool, or the event subscription. */
export function shortPath(c: TraceCall): string {
  if (c.kind === 'MCP') return `tools/call · ${c.mcpTool ?? ''}`;
  if (c.kind === 'EVENT') return 'SUBSCRIBE pastry/orders';
  return c.path.replace(REST_BASE, '');
}

/** Raw request of the call detail, with the W3C `traceparent` header after `Accept`. */
export function requestText(c: TraceCall): string {
  const raw = c.rawRequest ?? 'No content captured.';
  const { traceId, spanId } = traceIds(c.seq);
  return raw.replace('Accept: application/json', `Accept: application/json\ntraceparent: 00-${traceId}-${spanId}-01`);
}

/** Calls of the list: the replays, the streamed calls and the history, each call once, newest first. */
export function callPool(replayed: readonly TraceCall[], streamed: readonly TraceCall[], history: readonly TraceCall[]): TraceCall[] {
  const byId = new Map<string, TraceCall>();
  for (const c of [...replayed, ...streamed, ...history]) if (!byId.has(c.callId)) byId.set(c.callId, c);
  return [...byId.values()].sort((a, b) => b.at.localeCompare(a.at) || b.seq - a.seq);
}

/** The call goes through the focused graph node, or no node is focused. */
export const matchesNodeFocus = (c: TraceCall, focus: string) => !focus || c.clientId === focus || c.endpointId === focus || c.exampleId === focus;

/** Figures of the stats badges: calls over the last hour, calls no example matched, and MCP tool calls. */
export function traceStats(topology: TraceTopology, counts: FlowCounts): { totalCalls: number; noMatch: number; mcpCalls: number } {
  const totalCalls = Object.values(counts.clientEdge).reduce((a, b) => a + b, 0);
  const noMatch = topology.exampleEdges.filter((e) => !topology.examples.find((x) => x.id === e.to)?.ok).reduce((a, e) => a + (counts.exampleEdge[`${e.from}>${e.to}`] ?? 0), 0);
  const mcpCalls = topology.clientEdges.filter((e) => e.kind === 'MCP').reduce((a, e) => a + (counts.clientEdge[`${e.from}>${e.to}`] ?? 0), 0);
  return { totalCalls, noMatch, mcpCalls };
}

/** Options of the Service filter: the services with an endpoint in the graph. */
export const servicesWithEndpoints = <S extends { id: string }>(services: readonly S[], topology: TraceTopology) =>
  services.filter((s) => topology.endpoints.some((e) => e.serviceId === s.id));

/** Name of the focused graph node in the focus chip, an endpoint with its method; `''` without a focus. */
export function focusedNodeLabel(topology: TraceTopology, focus: string): string {
  const focusNode = [...topology.clients, ...topology.endpoints, ...topology.examples].find((n) => n.id === focus);
  return focusNode ? ('method' in focusNode ? `${focusNode.method} ${focusNode.label}` : focusNode.label) : '';
}

/** Caption of the list: `newest first · 3 calls`, or `newest first · 12 of 40 shown`. */
export const callListMeta = (matching: number) => `newest first · ${matching > MAX_ROWS ? `${MAX_ROWS} of ${matching} shown` : plural(matching, 'call')}`;

/** Status line of the call detail after a replay. */
export const replayNoteText = (c: TraceCall) => `Replayed at ${clockTime(c.at)} · new call at the top of the list`;

/** Target of the detail's Open link: the operation that answered the call, else its service. */
export const operationPath = (c: TraceCall) => (c.operationId ? `/services/${c.serviceId}/operations/${c.operationId}` : `/services/${c.serviceId}`);
