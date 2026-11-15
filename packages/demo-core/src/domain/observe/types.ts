import type { Protocol } from '../shared/index.js';

/** Legacy periods of `invocations()`. The Usage page uses `UsagePeriod`. */
export type Period = 'day' | 'week' | 'month';

export interface InvocationPoint {
  /** ISO hour (day period) or ISO date (week, month). */
  at: string;
  calls: number;
}

export interface Invocations {
  serviceId: string;
  period: Period;
  points: InvocationPoint[];
  total: number;
}

/** One service in the conformance treemap. */
export interface ConformanceItem {
  serviceId: string;
  name: string;
  protocol: Protocol;
  operations: number;
  /** Latest test score, 0..100, null when never tested. */
  score: number | null;
  /** Conformance index (coverage of the contract by examples), 0..100. */
  index: number;
  trend: 'up' | 'down' | 'stable' | null;
}

export interface DomainConformance {
  /** Value of the `domain` label, `other` when the service has none. */
  domain: string;
  /** Visible group name: "domain=pastry", or "no domain label". */
  label: string;
  /** 0..100, null when nothing is tested. */
  score: number | null;
  services: number;
  /** Services of the domain, for the treemap. */
  items?: ConformanceItem[];
}

/** Which way a mock call went: a REST call, an MCP tool call or an event. */
export type TraceKind = 'REST' | 'MCP' | 'EVENT';

/** One mock call, as shown in Live traces and in the Cockpit ticker. */
export interface TraceCall {
  seq: number;
  callId: string;
  at: string;
  serviceId: string;
  serviceName: string;
  protocol: Protocol;
  method: string;
  path: string;
  status: number;
  ms: number;
  /** Example that answered the call. */
  exampleName?: string;
  operationId?: string;
  /** W3C baggage when the call belongs to an Arazzo run (see `baggage()`). */
  baggage?: string;
  /** Run number and workflow name of the Arazzo run the baggage points to ("12", "Restock a pastry"). */
  arazzoRun?: number;
  workflowName?: string;
  request?: { headers: Record<string, string>; body?: string };
  response?: { headers: Record<string, string>; body?: string };
  kind?: TraceKind;
  clientId?: string;
  clientName?: string;
  clientIp?: string;
  endpointId?: string;
  endpointLabel?: string;
  dispatcher?: string;
  criteria?: string;
  exampleId?: string;
  mcpTool?: string;
  /** Verification session header (`x-microcks-session`). */
  sessionId?: string;
  /** Raw wire text of the request and the response. */
  rawRequest?: string;
  rawResponse?: string;
}

export interface TraceFilter {
  serviceId?: string;
  protocol?: Protocol;
  kind?: TraceKind;
  status?: 'ok' | 'error';
  /** Calls with microcks-arazzo baggage (or a verification session). */
  arazzoOnly?: boolean;
  /** Arazzo run id (`?run=`). */
  runId?: string;
}

export interface TopologyClient {
  id: string;
  label: string;
  /** IP address of the client. */
  ip: string;
  /** Second line of the graph node ("10.0.4.21 · HTTP", "Arazzo runs · HTTP"). */
  detail: string;
  kind: 'REST' | 'MCP' | 'MIXED' | 'ARAZZO';
}

export interface TopologyEndpoint {
  id: string;
  serviceId: string;
  method: string;
  label: string;
  detail: string;
  dispatcher: string;
  kinds: TraceKind[];
}

export interface TopologyExample {
  id: string;
  label: string;
  detail: string;
  /** `200`, `400` or `msg`. */
  code: string;
  ok: boolean;
}

export interface TopologyEdge {
  id: string;
  from: string;
  to: string;
  kind?: TraceKind;
  /** Calls in the last hour at page load. */
  base: number;
}

/** Who calls what and which example answers: the base counts of Live traces, plus the recent calls. */
export interface TraceTopology {
  clients: TopologyClient[];
  endpoints: TopologyEndpoint[];
  examples: TopologyExample[];
  clientEdges: TopologyEdge[];
  exampleEdges: TopologyEdge[];
  history: TraceCall[];
}
