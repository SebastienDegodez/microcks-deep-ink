import type { Protocol } from './protocol.js';

/** A `key=value` label attached to a service (`domain=pastry`). */
export interface Label {
  key: string;
  value: string;
}

/** `key=value` string form of a label, as used in URLs and filters. */
export function labelToString(label: Label): string {
  return `${label.key}=${label.value}`;
}

export function labelFromString(text: string): Label {
  const at = text.indexOf('=');
  return at < 0 ? { key: text, value: '' } : { key: text.slice(0, at), value: text.slice(at + 1) };
}

export type TestStatus = 'passed' | 'failed' | 'never';

/**
 * Catalogue row. Pages may only add OPTIONAL fields (phase-2 contract).
 * Dates are ISO-8601 strings; use `formatRelative(clock.now(), date)` to display them.
 */
export interface ServiceSummary {
  id: string;
  name: string;
  version: string;
  protocol: Protocol;
  /** Human readable contract format, for example "OpenAPI 3.0.2". */
  format: string;
  operationCount: number;
  exampleCount?: number;
  /** One entry per operation (last test result), or null when never tested. */
  lastResults: ('pass' | 'fail')[] | null;
  labels: Label[];
  testStatus: TestStatus;
  /** `checks`: passed / total checks of a run that counts checks rather than operations (A2A: 13/15). */
  lastTest?: { runId: string; when: string; checks?: { passed: number; total: number } };
  /** 0..100, or null when never tested. */
  conformance: number | null;
  calls24h: number;
  updatedAt: string;
  /** Exposed to agents through MCP. */
  mcp: boolean;
}

export type Dispatcher =
  | 'URI_PARTS'
  | 'URI_PARAMS'
  | 'URI_ELEMENTS'
  | 'QUERY_ARGS'
  | 'JSON_BODY'
  | 'SCRIPT'
  | 'FALLBACK';

export interface Operation {
  id: string;
  method: string;
  path: string;
  summary: string;
  calls: number;
  /** Sparkline values (last days of calls). */
  spark: number[];
  dispatcher: Dispatcher;
  rule: string;
  delayMs: number;
  mcpTool?: string;
  /** Short schema signature of the operation, as the Copilot prompt quotes it ("name path → Pastry"). */
  schemaSummary?: string;
}

export interface Example {
  id: string;
  name: string;
  request: { params: Record<string, string>; body?: string };
  response: { status: number; body: string };
  aiGenerated?: boolean;
  reviewState?: 'pending' | 'accepted';
}
