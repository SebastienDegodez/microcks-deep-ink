import type { TraceCall } from '../../domain/observe/index.js';
import type { Protocol, ServiceSummary } from '../../domain/shared/index.js';
import type { OperationOutcome } from '../../domain/testing/index.js';
import { fmt, operationUnit, pluralize } from '../shared/format.js';

/** Mock requests per hour today, 00 h to 11 h; the KPI bars mark the last one as the current hour. */
export const HOURS = [5, 1, 2, 1, 1, 6, 15, 40, 92, 121, 165, 125];

/** One step of the "Getting started" list of an empty install. */
export interface StartStep {
  id: string;
  title: string;
  desc: string;
  /** Command shown under the description. */
  code?: string;
  cta: string;
  to: string;
}

export const START_STEPS: readonly StartStep[] = [
  { id: 'import', title: 'Import a contract', desc: 'OpenAPI, AsyncAPI, gRPC Protobuf, GraphQL schema, Postman collection or SoapUI project. Drop a file or point to a Git URL.', cta: 'Import a contract', to: '/sources/new' },
  { id: 'call', title: 'Call the mock', desc: 'Every operation is served right after the import, at a URL derived from the service name and version.', code: 'curl http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille', cta: 'Browse APIs', to: '/services' },
  { id: 'test', title: 'Run a conformance test', desc: 'Point Microcks at your implementation. It replays the examples and checks responses against the contract.', cta: 'Run a test', to: '/tests/create' },
];

export type ConformanceLevel = 'high' | 'mid' | 'low' | 'none';

/** Conformance level, same thresholds as the prototype: 80 and 50. */
export const level = (c: number | null): ConformanceLevel => (c === null ? 'none' : c >= 80 ? 'high' : c >= 50 ? 'mid' : 'low');

export const PROTOCOL_ATTR: Record<Protocol, string> = { REST: 'rest', SOAP: 'soap', EVENT: 'event', gRPC: 'grpc', GRAPHQL: 'graphql', DIRECT: 'direct', A2A: 'a2a' };

/** Tone of a conformance figure for each level. */
export const TONE = { high: 'success', mid: 'warning', low: 'danger', none: 'neutral' } as const satisfies Record<ConformanceLevel, string>;

export const isLive = (s: ServiceSummary) => s.id === 'pastry2' || s.protocol === 'EVENT';

/** Usage line of a wall tile: operations, calls today and, for a live mock, its latest activity. */
export function usageText(s: ServiceSummary) {
  const unit = s.protocol === 'EVENT' ? 'msg' : 'req';
  return `${pluralize(s.operationCount, operationUnit(s.protocol))} · ${fmt(s.calls24h)} ${unit} today${isLive(s) ? (s.protocol === 'EVENT' ? ' · publishing on Kafka' : ' · called 12 s ago') : ''}`;
}

/** Counts of a recent test: checks of an agent test, passing operations otherwise. */
export const runCounts = (r: { operations?: OperationOutcome[]; runner: string; passed: number; total: number }) =>
  r.runner === 'A2A_CONFORMANCE' ? `${r.passed}/${r.total} checks` : r.operations ? `${r.operations.filter((o) => o === 'pass').length}/${r.operations.length} ops` : '';

/** "Tuesday, Nov 3, 2026 · 09:10": the demo clock, in UTC like the trace times. */
export const headerDate = (iso: string) => {
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `${day} · ${iso.slice(11, 16)}`;
};

/** Status column of the ticker: messages for events, OK for gRPC, the HTTP code otherwise. */
export const traceStatus = (t: TraceCall) =>
  t.protocol === 'EVENT' ? '1 msg' : `${t.protocol === 'gRPC' && t.status < 400 ? 'OK' : t.status} · ${t.ms} ms`;

/** Third part of the runner line: the transports of an agent test, the broker of an event test. */
export const runDetail = (r: { runner: string; endpoint: string }) =>
  r.runner === 'A2A_CONFORMANCE' ? '3 transports' : r.endpoint.startsWith('kafka') ? 'Kafka' : '';
