export type Protocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT' | 'A2A';

export const PROTOCOL_TOKEN: Record<Protocol, string> = {
  REST: 'proto-rest',
  SOAP: 'proto-soap',
  EVENT: 'proto-event',
  gRPC: 'proto-grpc',
  GRAPHQL: 'proto-graphql',
  DIRECT: 'proto-direct',
  A2A: 'proto-a2a',
};

/* ---------- Workflow loom (Arazzo) ---------- */

export type StepStatus = 'passed' | 'failed' | 'not-run';
export type CheckState = 'passed' | 'failed' | 'off' | 'not-evaluated';

export interface LoomSource {
  name: string;
  type: 'openapi' | 'asyncapi';
  protocol: Protocol;
  linked: boolean;
  /** Title and version of the source's API, shown in the lane header: "API Pastry 2.0". */
  serviceLabel?: string;
}

export type LoomAction =
  | {
      type: 'end';
      name: string;
      on: 'success' | 'failure';
      criteria: string;
      taken?: boolean;
      /** Short criteria drawn on the loom ("status == 'available'"); `criteria` stays the accessible text. */
      label?: string;
      /** Run the `taken` state comes from ("#14"): "not taken in #14". */
      runLabel?: string;
    }
  | {
      type: 'retry';
      name: string;
      on: 'failure';
      retryAfter: number;
      retryLimit: number;
      applied?: boolean;
      /** Run the attempts come from ("#14"): "3 attempts in #14". */
      runLabel?: string;
    };

/** A check row drawn on a node: "Call #2", "Data passing", "Contract". */
export interface LoomCheck {
  label: string;
  /** pass / fail; skip: deliberately not run (off); idle: not evaluated yet. */
  state: 'pass' | 'fail' | 'skip' | 'idle';
}

export interface LoomStep {
  stepId: string;
  source: string;
  /** "GET /pastries" */
  operation: string;
  /** HTTP method drawn as a tag on the node ("GET"); defaults to the first word of `operation`. */
  method?: string;
  /** Path drawn on the node ("/pastries/{name}"); defaults to the rest of `operation`. */
  path?: string;
  /** One-line result of the run ("200 · 3 attempts · 5.4 s"), drawn at the bottom of the node. */
  result?: string;
  /** Arazzo 1.1 step-level dependsOn. Steps without it run in parallel as soon as any step declares one. */
  dependsOn?: string[];
  status?: StepStatus;
  attempts?: number;
  /**
   * Checks drawn on the node: any list of `{ label, state }` rows, or the run's two checks
   * `{ successCriteria, schemaValidation? }` (drawn when `validatesSchemas` is set).
   */
  checks?: LoomCheck[] | { successCriteria: CheckState; schemaValidation?: CheckState };
  actions?: LoomAction[];
}

/** Where a thread's value is consumed: a step parameter or body, or a workflow output. */
export interface LoomDrop {
  /** stepId, or '$outputs' */
  to: string;
  /** Chip text: "name · path", "/price · body", "pastryName". */
  label: string;
  /** The consumer did not run, or the run produced no outputs: the chip is muted. */
  idle?: boolean;
  /** The consumer received another value ("Millefeuille"): drawn in danger, "· got Millefeuille". */
  bad?: string;
}

/**
 * A data thread (weft): one runtime expression, its producer and every place that consumes it.
 * The legacy form `{ from, to, expression }` (one consumer per thread) still works: threads with the same
 * producer and expression are woven into one row.
 */
export interface LoomThread {
  /** Stable id, used by the lens. Defaults to the expression. */
  id?: string;
  /** stepId or '$inputs' */
  from: string;
  /** Legacy single consumer: stepId or '$outputs'. Ignored when `drops` is set. */
  to?: string;
  expression: string;
  /** Value in the shown run, already formatted ('"M"'). */
  value?: string;
  /** The run did not produce the value: "— not produced". */
  missing?: boolean;
  drops?: LoomDrop[];
}

/** Workflow input, drawn in the inputs column. A bare string is the input name. */
export interface LoomInput {
  name: string;
  /** Defaults to "$inputs.<name>". */
  expression?: string;
  /** Value in the shown run, already formatted ('"M"', '3.9'). */
  value?: string;
}

/** Workflow output, drawn in the outputs column. A bare string is the output name. */
export interface LoomOutput {
  name: string;
  /** Value in the shown run, already formatted; "—" when absent. */
  value?: string;
}

export function parseJson<T>(value: T | string | undefined, fallback: T): T {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
