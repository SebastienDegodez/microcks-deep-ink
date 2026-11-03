import { baggage } from '@/domain/arazzo';
import type { TopologyClient, TopologyEdge, TopologyEndpoint, TopologyExample, TraceCall, TraceKind } from '@/domain/observe';
import { RUN_IDS, SESSION_ID } from '../../shared';

const REST_BASE = '/rest/API+Pastry/2.0';
const MCP_PATH = '/mcp/API+Pastry/2.0';
const TOPIC = 'PastryordersAPI-0.1.0-pastry-orders';
const NOW_MS = Date.parse('2026-11-03T09:10:04.208Z');

export const TOPOLOGY_CLIENTS: TopologyClient[] = [
  { id: 'c1', label: 'checkout-web', detail: '10.0.4.21 · HTTP', kind: 'REST' },
  { id: 'c3', label: 'copilot-agent (MCP)', detail: '10.0.9.3 · MCP client', kind: 'MCP' },
  { id: 'c2', label: 'order-service', detail: '10.0.7.12 · HTTP + Kafka', kind: 'MIXED' },
  { id: 'c4', label: 'microcks-arazzo', detail: '10.0.2.8 · Arazzo runs · HTTP', kind: 'ARAZZO' },
];

export const TOPOLOGY_ENDPOINTS: TopologyEndpoint[] = [
  { id: 'e1', serviceId: 'pastry2', method: 'GET', label: '/pastries/{name}', detail: 'API Pastry 2.0 · URI_PARTS', dispatcher: 'URI_PARTS · rule: name', kinds: ['REST', 'MCP'] },
  { id: 'e2', serviceId: 'pastry2', method: 'GET', label: '/pastries', detail: 'API Pastry 2.0 · URI_PARAMS', dispatcher: 'URI_PARAMS · rule: size', kinds: ['REST', 'MCP'] },
  { id: 'e3', serviceId: 'pastry2', method: 'PATCH', label: '/pastries/{name}', detail: 'API Pastry 2.0 · URI_PARTS', dispatcher: 'URI_PARTS · rule: name', kinds: ['REST'] },
  { id: 'e4', serviceId: 'orders', method: 'SUB', label: 'pastry/orders', detail: 'Pastry orders API 0.1.0 · Kafka', dispatcher: 'none · published every 12 s', kinds: ['EVENT'] },
];

export const TOPOLOGY_EXAMPLES: TopologyExample[] = [
  { id: 'd1', label: 'Millefeuille', detail: '/name=Millefeuille', code: '200', ok: true },
  { id: 'd2', label: 'Eclair Cafe', detail: '/name=Eclair Cafe', code: '200', ok: true },
  { id: 'd6', label: 'No matching example', detail: 'unknown name', code: '400', ok: false },
  { id: 'd3', label: 'Size M', detail: '?size=M', code: '200', ok: true },
  { id: 'd4', label: 'Eclair Chocolat · price', detail: '/name=Eclair Chocolat', code: '200', ok: true },
  { id: 'd5', label: 'Validated order', detail: 'Kafka message', code: 'msg', ok: true },
];

export const CLIENT_EDGES: TopologyEdge[] = [
  { id: 'c1e1', from: 'c1', to: 'e1', kind: 'REST', base: 412 },
  { id: 'c1e2', from: 'c1', to: 'e2', kind: 'REST', base: 96 },
  { id: 'c3e1', from: 'c3', to: 'e1', kind: 'MCP', base: 38 },
  { id: 'c3e2', from: 'c3', to: 'e2', kind: 'MCP', base: 12 },
  { id: 'c2e3', from: 'c2', to: 'e3', kind: 'REST', base: 41 },
  { id: 'c2e4', from: 'c2', to: 'e4', kind: 'EVENT', base: 300 },
  { id: 'c4e2', from: 'c4', to: 'e2', kind: 'REST', base: 4 },
  { id: 'c4e1', from: 'c4', to: 'e1', kind: 'REST', base: 8 },
];

export const EXAMPLE_EDGES: TopologyEdge[] = [
  { id: 'e1d1', from: 'e1', to: 'd1', base: 268 },
  { id: 'e1d2', from: 'e1', to: 'd2', base: 159 },
  { id: 'e1d6', from: 'e1', to: 'd6', base: 31 },
  { id: 'e2d3', from: 'e2', to: 'd3', base: 112 },
  { id: 'e3d4', from: 'e3', to: 'd4', base: 41 },
  { id: 'e4d5', from: 'e4', to: 'd5', base: 300 },
];

const PASTRIES = {
  mille: { name: 'Millefeuille', description: 'Delicious Millefeuille, not caloric at all', size: 'L', price: 4.4, status: 'available' },
  cafe: { name: 'Eclair Cafe', description: 'Delicious Coffee Eclair, not caloric at all', size: 'M', price: 2.5, status: 'available' },
  choco: { name: 'Eclair Chocolat', description: 'Delicious Chocolate Eclair, not caloric at all', size: 'M', price: 2.4, status: 'unknown' },
};

const js = (value: unknown) => JSON.stringify(value, null, 2);
const httpReq = (method: string, path: string, agent: string, extra = '') =>
  `${method} ${path} HTTP/1.1\nHost: microcks.local:8080\nAccept: application/json\nUser-Agent: ${agent}${extra}`;
const httpRes = (code: string, body: string) => `HTTP/1.1 ${code}\nContent-Type: application/json\nContent-Length: ${body.length}${body ? `\n\n${body}` : ''}`;
const mcpReq = (tool: string, args: unknown) =>
  `POST ${MCP_PATH} HTTP/1.1\nHost: microcks.local:8080\nContent-Type: application/json\nMcp-Session-Id: 7f3c9a1e\n\n${js({ jsonrpc: '2.0', id: 42, method: 'tools/call', params: { name: tool, arguments: args } })}`;
const mcpRes = (payload: unknown) =>
  `HTTP/1.1 200 OK\nContent-Type: application/json\n\n${js({ jsonrpc: '2.0', id: 42, result: { content: [{ type: 'text', text: JSON.stringify(payload) }], isError: false } })}`;

interface Template {
  clientId: string;
  endpointId: string;
  exampleId: string;
  exampleName: string;
  operationId?: string;
  kind: TraceKind;
  method: string;
  path: string;
  status: number;
  criteria: string;
  latency: number;
  mcpTool?: string;
  arazzo?: { workflow: string; step: string };
  session?: string;
  rawRequest: string;
  rawResponse: string;
}

const TEMPLATES: Record<string, Template> = {
  'arazzo-list': {
    clientId: 'c4', endpointId: 'e2', exampleId: 'd3', exampleName: 'Size M', operationId: 'get-list', kind: 'REST', method: 'GET',
    path: `${REST_BASE}/pastries?size=M`, status: 200, criteria: '?size=M', latency: 4, arazzo: { workflow: 'restock-pastry', step: 'listPastries' },
    rawRequest: httpReq('GET', `${REST_BASE}/pastries?size=M`, 'microcks-arazzo'), rawResponse: httpRes('200 OK', js([PASTRIES.cafe, PASTRIES.choco])),
  },
  'arazzo-get': {
    clientId: 'c4', endpointId: 'e1', exampleId: 'd2', exampleName: 'Eclair Cafe', operationId: 'get-name', kind: 'REST', method: 'GET',
    path: `${REST_BASE}/pastries/Eclair%20Cafe`, status: 200, criteria: '/name=Eclair Cafe', latency: 3, arazzo: { workflow: 'restock-pastry', step: 'getPastry' },
    rawRequest: httpReq('GET', `${REST_BASE}/pastries/Eclair%20Cafe`, 'microcks-arazzo'), rawResponse: httpRes('200 OK', js(PASTRIES.cafe)),
  },
  'session-size': {
    clientId: 'c1', endpointId: 'e2', exampleId: 'd3', exampleName: 'Size M', operationId: 'get-list', kind: 'REST', method: 'GET',
    path: `${REST_BASE}/pastries?size=M`, status: 200, criteria: '?size=M', latency: 5, session: SESSION_ID,
    rawRequest: httpReq('GET', `${REST_BASE}/pastries?size=M`, 'checkout-web/3.4.1', `\nx-microcks-session: ${SESSION_ID}`),
    rawResponse: httpRes('200 OK', js([PASTRIES.cafe, PASTRIES.choco])),
  },
  'mille-web': {
    clientId: 'c1', endpointId: 'e1', exampleId: 'd1', exampleName: 'Millefeuille', operationId: 'get-name', kind: 'REST', method: 'GET',
    path: `${REST_BASE}/pastries/Millefeuille`, status: 200, criteria: '/name=Millefeuille', latency: 4,
    rawRequest: httpReq('GET', `${REST_BASE}/pastries/Millefeuille`, 'checkout-web/3.4.1'), rawResponse: httpRes('200 OK', js(PASTRIES.mille)),
  },
  'cafe-web': {
    clientId: 'c1', endpointId: 'e1', exampleId: 'd2', exampleName: 'Eclair Cafe', operationId: 'get-name', kind: 'REST', method: 'GET',
    path: `${REST_BASE}/pastries/Eclair%20Cafe`, status: 200, criteria: '/name=Eclair Cafe', latency: 3,
    rawRequest: httpReq('GET', `${REST_BASE}/pastries/Eclair%20Cafe`, 'checkout-web/3.4.1'), rawResponse: httpRes('200 OK', js(PASTRIES.cafe)),
  },
  'size-web': {
    clientId: 'c1', endpointId: 'e2', exampleId: 'd3', exampleName: 'Size M', operationId: 'get-list', kind: 'REST', method: 'GET',
    path: `${REST_BASE}/pastries?size=M`, status: 200, criteria: '?size=M', latency: 5,
    rawRequest: httpReq('GET', `${REST_BASE}/pastries?size=M`, 'checkout-web/3.4.1'), rawResponse: httpRes('200 OK', js([PASTRIES.cafe, PASTRIES.choco])),
  },
  'tatin-web': {
    clientId: 'c1', endpointId: 'e1', exampleId: 'd6', exampleName: 'No matching example', operationId: 'get-name', kind: 'REST', method: 'GET',
    path: `${REST_BASE}/pastries/Tarte%20Tatin`, status: 400, criteria: '/name=Tarte Tatin', latency: 2,
    rawRequest: httpReq('GET', `${REST_BASE}/pastries/Tarte%20Tatin`, 'checkout-web/3.4.1'), rawResponse: httpRes('400 Bad Request', ''),
  },
  'patch-order': {
    clientId: 'c2', endpointId: 'e3', exampleId: 'd4', exampleName: 'Eclair Chocolat · price', operationId: 'patch-name', kind: 'REST', method: 'PATCH',
    path: `${REST_BASE}/pastries/Eclair%20Chocolat`, status: 200, criteria: '/name=Eclair Chocolat', latency: 6,
    rawRequest: httpReq('PATCH', `${REST_BASE}/pastries/Eclair%20Chocolat`, 'order-service/1.12.0', `\nContent-Type: application/json\n\n${js({ price: 2.6 })}`),
    rawResponse: httpRes('200 OK', js({ ...PASTRIES.choco, price: 2.6 })),
  },
  'mcp-cafe': {
    clientId: 'c3', endpointId: 'e1', exampleId: 'd2', exampleName: 'Eclair Cafe', operationId: 'get-name', kind: 'MCP', method: 'POST', path: MCP_PATH,
    mcpTool: 'get_pastries_name', status: 200, criteria: '/name=Eclair Cafe', latency: 18,
    rawRequest: mcpReq('get_pastries_name', { name: 'Eclair Cafe' }), rawResponse: mcpRes(PASTRIES.cafe),
  },
  'mcp-size': {
    clientId: 'c3', endpointId: 'e2', exampleId: 'd3', exampleName: 'Size M', operationId: 'get-list', kind: 'MCP', method: 'POST', path: MCP_PATH,
    mcpTool: 'get_pastries', status: 200, criteria: '?size=M', latency: 21,
    rawRequest: mcpReq('get_pastries', { size: 'M' }), rawResponse: mcpRes([PASTRIES.cafe, PASTRIES.choco]),
  },
  event: {
    clientId: 'c2', endpointId: 'e4', exampleId: 'd5', exampleName: 'Validated order', kind: 'EVENT', method: 'SUB', path: TOPIC, status: 200, criteria: 'none', latency: 1,
    rawRequest: `Kafka topic   ${TOPIC}\nBroker        kafka.local:9092\nConsumer      order-service (group order-service-v1)\nOperation     SUBSCRIBE pastry/orders`,
    rawResponse: `Key           ord-20261102-0147\nHeaders       content-type: application/json\n\n${js({
      id: 'ord-20261102-0147', customerId: 'cust-0815', status: 'VALIDATED', productQuantities: [{ productName: 'Millefeuille', quantity: 2 }, { productName: 'Eclair Cafe', quantity: 1 }],
    })}`,
  },
};

/** The 10 calls Live traces opens with: calls 3 and 4 come from Arazzo run #12, call 7 from session s-7f3a2c91. */
export const HISTORY_TEMPLATES = ['mille-web', 'event', 'arazzo-list', 'arazzo-get', 'mcp-cafe', 'cafe-web', 'session-size', 'size-web', 'event', 'patch-order'];

/** What the stream plays after the history. Arazzo calls belong to run #14. */
export const STREAM_CYCLE = [
  'mille-web', 'event', 'mcp-cafe', 'arazzo-list', 'cafe-web', 'size-web', 'event', 'arazzo-get', 'patch-order', 'tatin-web', 'mcp-size', 'event', 'cafe-web', 'session-size',
];

export const HISTORY_LENGTH = HISTORY_TEMPLATES.length;

const CLIENT_BY_ID = new Map(TOPOLOGY_CLIENTS.map((c) => [c.id, c]));
const ENDPOINT_BY_ID = new Map(TOPOLOGY_ENDPOINTS.map((e) => [e.id, e]));

export function atOf(seq: number): string {
  const offset = seq <= HISTORY_LENGTH ? -(HISTORY_LENGTH - seq) * 3200 : (seq - HISTORY_LENGTH) * 1200;
  return new Date(NOW_MS + offset + ((seq * 137) % 600)).toISOString();
}

/** Builds call number `seq`. History calls (1..10) follow `HISTORY_TEMPLATES`, later ones `STREAM_CYCLE`. */
export function makeCall(seq: number): TraceCall {
  const key = seq <= HISTORY_LENGTH ? HISTORY_TEMPLATES[seq - 1] : STREAM_CYCLE[(seq - HISTORY_LENGTH - 1) % STREAM_CYCLE.length];
  const tpl = TEMPLATES[key ?? 'mille-web'] as Template;
  const client = CLIENT_BY_ID.get(tpl.clientId);
  const endpoint = ENDPOINT_BY_ID.get(tpl.endpointId);
  const isEvent = tpl.kind === 'EVENT';
  // Arazzo calls of the history belong to run #12 (mocks); streamed ones to run #14.
  const runId = seq <= HISTORY_LENGTH ? RUN_IDS[12] : RUN_IDS[14];
  const attempt = 1;
  const bag = tpl.arazzo ? baggage(runId, tpl.arazzo.workflow, tpl.arazzo.step, attempt) : undefined;
  return {
    seq,
    callId: `call-${seq}`,
    at: atOf(seq),
    serviceId: endpoint?.serviceId ?? 'pastry2',
    serviceName: isEvent ? 'Pastry orders API 0.1.0' : 'API Pastry 2.0',
    protocol: isEvent ? 'EVENT' : 'REST',
    method: tpl.method,
    path: tpl.path,
    status: tpl.status,
    ms: tpl.latency + (seq % 3),
    exampleName: tpl.exampleName,
    operationId: tpl.operationId,
    baggage: bag,
    request: { headers: { accept: 'application/json' } },
    response: { headers: { 'content-type': 'application/json' } },
    kind: tpl.kind,
    clientId: tpl.clientId,
    clientName: client?.label,
    clientIp: client?.detail.split(' · ')[0],
    endpointId: tpl.endpointId,
    endpointLabel: endpoint?.label,
    dispatcher: endpoint?.dispatcher,
    criteria: tpl.criteria,
    exampleId: tpl.exampleId,
    mcpTool: tpl.mcpTool,
    sessionId: tpl.session,
    // Arazzo calls are body-less GETs: the baggage header goes last.
    rawRequest: bag ? `${tpl.rawRequest}\nbaggage: ${bag}` : tpl.rawRequest,
    rawResponse: tpl.rawResponse,
  };
}

export function historyCalls(): TraceCall[] {
  return Array.from({ length: HISTORY_LENGTH }, (_, i) => makeCall(i + 1));
}
