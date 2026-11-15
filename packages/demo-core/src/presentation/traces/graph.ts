import type { FlowCounts, TopologyEdge, TopologyExample, TraceCall, TraceTopology } from '../../domain/observe/index.js';

/** Graph geometry of the prototype: 56px nodes on a 72px slot, six slots per 416px column. */
const SLOT = 72;
const NODE = 56;
/** Height of a column, in px: the height of the edges' `viewBox`. */
export const HEIGHT = 416;
const yOf = (len: number, idx: number) => ((6 - len) * SLOT) / 2 + idx * SLOT + NODE / 2;

/** Filters of the page that dim the edges of the graph. */
export interface GraphFilter {
  serviceId: string;
  kind: string;
  status: '' | 'ok' | 'error';
}

/** Colour of an edge: its protocol, or `miss` towards an example that answers no call. */
export type EdgeTone = 'rest' | 'mcp' | 'event' | 'miss';

/** One edge as drawn: its path, the top of its label, its colour and width, its flash, lit or not, and its count. */
export interface EdgeView {
  id: string;
  from: string;
  to: string;
  d: string;
  top: number;
  tone: EdgeTone;
  width: number;
  flash: boolean;
  on: boolean;
  count: number;
}

/** Edges of the graph, clients → endpoints (`edges1`) and endpoints → examples (`edges2`), lit by the filters and the focus. */
export function graphEdges(topology: TraceTopology, counts: FlowCounts, filter: GraphFilter, focus: string, flash?: TraceCall): { edges1: EdgeView[]; edges2: EdgeView[] } {
  const { clients, endpoints, examples, clientEdges, exampleEdges } = topology;
  const endpoint = (id: string) => endpoints.find((e) => e.id === id);
  const example = (id: string) => examples.find((e) => e.id === id);

  // Which edges stay lit under the filters and the node focus (prototype `active1` / `active2`).
  const svcOk = (epId: string) => !filter.serviceId || endpoint(epId)?.serviceId === filter.serviceId;
  const kindOk = (e: TopologyEdge) => !filter.kind || e.kind === filter.kind;
  const exStatusOk = (exId: string) => !filter.status || (filter.status === 'ok' ? Boolean(example(exId)?.ok) : !example(exId)?.ok);
  const epHasStatus = (epId: string) => exampleEdges.some((e) => e.from === epId && exStatusOk(e.to));
  const f = focus;
  const focusOk1 = (e: TopologyEdge) => !f || f === e.from || f === e.to || exampleEdges.some((x) => x.from === e.to && x.to === f);
  const focusOk2 = (e: TopologyEdge) => !f || f === e.from || f === e.to || clientEdges.some((x) => x.to === e.from && x.from === f && kindOk(x));
  const active1 = (e: TopologyEdge) => svcOk(e.to) && kindOk(e) && epHasStatus(e.to) && focusOk1(e);
  const active2 = (e: TopologyEdge) => svcOk(e.from) && exStatusOk(e.to) && clientEdges.some((x) => x.to === e.from && kindOk(x)) && focusOk2(e);

  const count1 = (e: TopologyEdge) => counts.clientEdge[`${e.from}>${e.to}`] ?? 0;
  const count2 = (e: TopologyEdge) => counts.exampleEdge[`${e.from}>${e.to}`] ?? 0;
  const max1 = Math.max(1, ...clientEdges.map(count1));
  const max2 = Math.max(1, ...exampleEdges.map(count2));

  const edges1: EdgeView[] = clientEdges.map((e) => {
    const y1 = yOf(clients.length, clients.findIndex((c) => c.id === e.from));
    const y2 = yOf(endpoints.length, endpoints.findIndex((x) => x.id === e.to));
    const n = count1(e);
    return {
      id: e.id, from: e.from, to: e.to, d: `M0 ${y1} L100 ${y2}`, top: y1 + (y2 - y1) * 0.76,
      tone: e.kind === 'MCP' ? 'mcp' : e.kind === 'EVENT' ? 'event' : 'rest',
      width: 1.2 + (2.6 * n) / max1, flash: Boolean(flash && flash.clientId === e.from && flash.endpointId === e.to), on: active1(e), count: n,
    };
  });
  const edges2: EdgeView[] = exampleEdges.map((e) => {
    const y1 = yOf(endpoints.length, endpoints.findIndex((x) => x.id === e.from));
    const y2 = yOf(examples.length, examples.findIndex((x) => x.id === e.to));
    const n = count2(e);
    const isEvent = endpoint(e.from)?.kinds.includes('EVENT');
    return {
      id: e.id, from: e.from, to: e.to, d: `M0 ${y1} L100 ${y2}`, top: (y1 + y2) / 2,
      tone: !example(e.to)?.ok ? 'miss' : isEvent ? 'event' : 'rest',
      width: 1.2 + (2.6 * n) / max2, flash: Boolean(flash && flash.endpointId === e.from && flash.exampleId === e.to), on: active2(e), count: n,
    };
  });
  return { edges1, edges2 };
}

/** The node has a lit edge. */
export const touches = (edges: readonly EdgeView[], id: string) => edges.some((e) => (e.from === id || e.to === id) && e.on);

/** Calls that leave the node: the sum of its outgoing edges. */
export const sumFrom = (edges: readonly EdgeView[], id: string) => edges.reduce((a, e) => a + (e.from === id ? e.count : 0), 0);

/** Calls that reach the node: the sum of its incoming edges. */
export const sumTo = (edges: readonly EdgeView[], id: string) => edges.reduce((a, e) => a + (e.to === id ? e.count : 0), 0);

/** `data-kind` of an example node: `miss` when it doesn't answer, `event` when an event endpoint feeds it, else `rest`. */
export function exampleKind(topology: TraceTopology, x: TopologyExample): 'miss' | 'event' | 'rest' {
  const event = topology.exampleEdges.some((e) => e.to === x.id && topology.endpoints.find((p) => p.id === e.from)?.kinds.includes('EVENT'));
  return !x.ok ? 'miss' : event ? 'event' : 'rest';
}

/** Name of a node in the graph's table: the client, the endpoint with its method, or the example. */
export function nameOf(topology: TraceTopology, id: string): string {
  const c = topology.clients.find((x) => x.id === id);
  if (c) return c.label;
  const e = topology.endpoints.find((x) => x.id === id);
  if (e) return `${e.method} ${e.label}`;
  return topology.examples.find((x) => x.id === id)?.label ?? id;
}
