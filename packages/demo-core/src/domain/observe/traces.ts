import type { TraceCall, TraceFilter, TraceTopology } from './types.js';

/** Value of `?run=`: a run id, or the whole W3C baggage string copied from the run page. */
export function parseRunParam(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = decodeURIComponent(value.trim());
  const match = /microcks-arazzo-run=([^,;\s]+)/.exec(trimmed);
  const id = match?.[1] ?? trimmed;
  return /^[A-Za-z0-9_-]+$/.test(id) ? id : undefined;
}

export function runIdOfBaggage(baggage: string | undefined): string | undefined {
  return baggage ? /microcks-arazzo-run=([^,;\s]+)/.exec(baggage)?.[1] : undefined;
}

export function matchesTraceFilter(call: TraceCall, f: TraceFilter): boolean {
  if (f.serviceId && call.serviceId !== f.serviceId) return false;
  if (f.protocol && call.protocol !== f.protocol) return false;
  if (f.kind && call.kind !== f.kind) return false;
  if (f.status === 'ok' && call.status >= 400) return false;
  if (f.status === 'error' && call.status < 400) return false;
  if (f.arazzoOnly && !call.baggage && !call.sessionId) return false;
  if (f.runId && runIdOfBaggage(call.baggage) !== f.runId) return false;
  return true;
}

export function hasFilter(f: TraceFilter): boolean {
  return Boolean(f.serviceId || f.protocol || f.kind || f.status || f.arazzoOnly || f.runId);
}

export function isMiss(call: Pick<TraceCall, 'status'>): boolean {
  return call.status >= 400;
}

/** Words for the status column: never only a color. */
export function statusLabel(call: Pick<TraceCall, 'status' | 'kind'>): string {
  if (call.kind === 'EVENT') return 'delivered';
  if (call.status === 200) return '200 OK';
  if (call.status === 400) return '400 Bad Request';
  return String(call.status);
}

export function clockTime(iso: string): string {
  const d = new Date(iso);
  const two = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${two(d.getUTCHours())}:${two(d.getUTCMinutes())}:${two(d.getUTCSeconds())}.${two(d.getUTCMilliseconds(), 3)}`;
}

const hex = (n: number) => ((n * 2654435761) >>> 0).toString(16).padStart(8, '0');

/** Deterministic W3C trace and span ids for a call. */
export function traceIds(seq: number): { traceId: string; spanId: string } {
  return { traceId: hex(seq) + hex(seq + 7) + hex(seq + 13) + hex(seq + 29), spanId: hex(seq + 3) + hex(seq + 5) };
}

export interface TraceEvent {
  at: string;
  text: string;
}

/** Span events of a call (what Microcks did), in order. */
export function traceEvents(call: TraceCall): TraceEvent[] {
  const base = new Date(call.at).getTime();
  const at = (offset: number) => clockTime(new Date(base + offset).toISOString());
  const events: TraceEvent[] =
    call.kind === 'EVENT'
      ? [
          { at: at(0), text: 'message produced · SUBSCRIBE pastry/orders' },
          { at: at(1), text: `example selected · ${call.exampleName ?? 'none'}` },
          { at: at(1), text: `published to ${call.path}` },
        ]
      : [
          {
            at: at(0),
            text: `invocation received · ${call.kind === 'MCP' ? `tools/call ${call.mcpTool ?? ''}` : `${call.method} ${call.endpointLabel ?? call.path}`}`,
          },
          { at: at(1), text: `dispatcher ${(call.dispatcher ?? '').split(' ·')[0]} · criteria ${call.criteria ?? 'none'}` },
          {
            at: at(1),
            text: isMiss(call) ? 'no response found for criteria' : `response selected · ${call.exampleName ?? 'none'}`,
          },
          { at: at(call.ms), text: `response sent · ${call.status}` },
        ];
  const run = call.baggage ? /microcks-arazzo-workflow=([^,]+),microcks-arazzo-step=([^,]+),microcks-arazzo-attempt=(\d+)/.exec(call.baggage) : null;
  if (run) events.splice(1, 0, { at: at(0), text: `baggage · workflow ${run[1]} · step ${run[2]} · attempt ${run[3]}` });
  if (call.sessionId) events.splice(1, 0, { at: at(0), text: `session ${call.sessionId} · answered along restock-pastry` });
  return events;
}

export interface FlowCounts {
  client: Record<string, number>;
  clientEdge: Record<string, number>;
  endpoint: Record<string, number>;
  example: Record<string, number>;
  exampleEdge: Record<string, number>;
}

/** Base counts of the topology plus the calls streamed since the page opened. */
export function flowCounts(topology: TraceTopology, streamed: readonly TraceCall[]): FlowCounts {
  const clientEdge: Record<string, number> = {};
  const exampleEdge: Record<string, number> = {};
  for (const e of topology.clientEdges) clientEdge[`${e.from}>${e.to}`] = e.base;
  for (const e of topology.exampleEdges) exampleEdge[`${e.from}>${e.to}`] = e.base;
  for (const c of streamed) {
    if (!c.clientId || !c.endpointId || !c.exampleId) continue;
    const k1 = `${c.clientId}>${c.endpointId}`;
    const k2 = `${c.endpointId}>${c.exampleId}`;
    clientEdge[k1] = (clientEdge[k1] ?? 0) + 1;
    exampleEdge[k2] = (exampleEdge[k2] ?? 0) + 1;
  }
  const client: Record<string, number> = {};
  const endpoint: Record<string, number> = {};
  const example: Record<string, number> = {};
  for (const e of topology.clientEdges) {
    const n = clientEdge[`${e.from}>${e.to}`] ?? 0;
    client[e.from] = (client[e.from] ?? 0) + n;
    endpoint[e.to] = (endpoint[e.to] ?? 0) + n;
  }
  for (const e of topology.exampleEdges) example[e.to] = (example[e.to] ?? 0) + (exampleEdge[`${e.from}>${e.to}`] ?? 0);
  return { client, clientEdge, endpoint, example, exampleEdge };
}
