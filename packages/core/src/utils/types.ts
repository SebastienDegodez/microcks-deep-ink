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

/** Entry of the command bar. `kind` groups the results; 'action' items are commands. */
export interface CommandItem {
  id: string;
  label: string;
  /** 'action' items are commands (run a test…); others are navigation targets. */
  kind: 'action' | 'service' | 'operation' | 'test';
  protocol?: Protocol;
  hint?: string;
  keywords?: string[];
}

/* ---------- Workflow loom (Arazzo) ---------- */

export type StepStatus = 'passed' | 'failed' | 'not-run';
export type CheckState = 'passed' | 'failed' | 'off' | 'not-evaluated';

export interface LoomSource {
  name: string;
  type: 'openapi' | 'asyncapi';
  protocol: Protocol;
  linked: boolean;
}

export type LoomAction =
  | { type: 'end'; name: string; on: 'success' | 'failure'; criteria: string; taken?: boolean }
  | { type: 'retry'; name: string; on: 'failure'; retryAfter: number; retryLimit: number; applied?: boolean };

export interface LoomStep {
  stepId: string;
  source: string;
  /** "GET /pastries" */
  operation: string;
  /** Arazzo 1.1 step-level dependsOn. Steps without it run in parallel as soon as any step declares one. */
  dependsOn?: string[];
  status?: StepStatus;
  attempts?: number;
  checks?: { successCriteria: CheckState; schemaValidation?: CheckState };
  actions?: LoomAction[];
}

export interface LoomThread {
  /** stepId or '$inputs' */
  from: string;
  /** stepId or '$outputs' */
  to: string;
  expression: string;
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
