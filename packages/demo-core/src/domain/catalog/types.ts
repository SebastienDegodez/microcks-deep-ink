import type { Dispatcher, Example, Label } from '../shared/index.js';

/** Parameter constraint of an operation (Behavior screen). */
export interface ParameterConstraint {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  recopy?: boolean;
  mustMatchRegexp?: string;
}

/** Dispatchers a person can choose on the Behavior screen (`PROXY_FALLBACK` is not part of the catalogue summary). */
export type BehaviorDispatcher = Dispatcher | 'PROXY_FALLBACK';

export type ScriptLanguage = 'GROOVY' | 'JS';

/** How an operation answers: dispatcher, rules, delay and constraints. */
export interface Behavior {
  dispatcher: BehaviorDispatcher;
  /**
   * Dispatcher rule. URI_PARTS / URI_PARAMS: parameter names joined with `&&`. JSON_BODY: a JSON
   * document `{exp, operator, cases}`. FALLBACK / PROXY_FALLBACK: the rule of the dispatcher tried first.
   */
  rule: string;
  delayMs: number;
  constraints: ParameterConstraint[];
  stateful: boolean;
  delayStrategy?: 'fixed' | 'random';
  scriptLanguage?: ScriptLanguage;
  script?: string;
  /** FALLBACK: name of the example served when nothing matches. */
  fallback?: string;
  /** PROXY_FALLBACK: base URL calls are forwarded to when nothing matches. */
  proxyUrl?: string;
  /** FALLBACK / PROXY_FALLBACK: the dispatcher tried first (defaults to URI_PARTS). */
  baseDispatcher?: 'URI_PARTS' | 'URI_PARAMS';
}

/** A step of a workflow that calls an operation of the service. */
export interface WorkflowUsageStep {
  stepId: string;
  /** Arazzo operationId of the step (`GetPastryByName`). */
  operationId: string;
  /** Catalogue operation id the step resolves to (`get-name`), when known. */
  catalogOperationId?: string;
}

export type WorkflowUsageResult =
  | { kind: 'passed' | 'failed'; runNumber: number; runId: string; target: 'mocks' | 'implementations' | 'mixed'; at: string }
  | { kind: 'blocked'; reason: string }
  | { kind: 'never' };

/** A workflow that calls an operation (for "Used by workflows"). */
export interface WorkflowUsage {
  documentId: string;
  workflowId: string;
  summary: string;
  stepIds: string[];
  steps?: WorkflowUsageStep[];
  result?: WorkflowUsageResult;
}

export interface SimulationRequest {
  /** Request path or query string typed in the simulator, e.g. `/pastries/Eclair%20Cafe`. */
  path: string;
  params: Record<string, string>;
  body?: string;
  /** Request headers (the simulator can send `x-api-key`). */
  headers?: Record<string, string>;
  /** Values the stateful store holds (view counters), by key. */
  store?: Record<string, number>;
}

export type StepKind = 'ok' | 'fail' | 'warn' | 'skip' | 'info';

/** One line of the simulator trace ("Operation", "Constraints", "Dispatch criteria", "Matched example"...). */
export interface SimulationStep {
  label: string;
  value: string;
  kind: StepKind;
}

export type SimulationOutcome = 'matched' | 'no-operation' | 'constraint' | 'no-match' | 'forwarded';

export interface SimulationTrace {
  outcome: SimulationOutcome;
  /** `GET /pastries/Eclair%20Cafe` */
  requestLine: string;
  /** HTTP status, or null when the call is forwarded to the real backend. */
  status: number | null;
  /** `200 OK`, `404 Not Found`, `Forwarded`... */
  statusLabel: string;
  /** `/name=Eclair Cafe → Eclair Cafe → 200` */
  chain: string;
  steps: SimulationStep[];
  mediaType: string;
  headers: string[];
  body: string;
  forwardedTo?: string;
  /** Stateful mocks: key the call increments in the store. */
  storeKey?: string;
}

export type SimulationResult =
  | ({ matched: true; exampleId: string; example: Example } & SimulationTrace)
  | ({ matched: false; reason: string } & SimulationTrace);

export interface LabelCount {
  label: Label;
  count: number;
}

export interface ServiceFilter {
  query?: string;
  protocols?: string[];
  /** `key=value` strings. A service must carry ALL of them. */
  labels?: string[];
  testStatus?: 'all' | 'passed' | 'failed' | 'never';
}

/** Entry of the command bar (⌘K). Same shape as the design system's `CommandItem`. */
export interface CommandItem {
  id: string;
  label: string;
  kind: string;
  hint?: string;
  /** Hash route to navigate to, e.g. `/services/pastry2`. */
  href?: string;
}
