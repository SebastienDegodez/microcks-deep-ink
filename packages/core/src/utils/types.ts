export type Protocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT';

export type Outcome = 'conformant' | 'failed' | 'partial' | 'running' | 'never';

export type ProofStatus = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

export type OperationResult = 'pass' | 'fail' | 'untested';

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  badge?: string;
  /** Items contributed by a plugin carry its id, so the nav can mark them. */
  pluginId?: string;
}

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface CommandItem {
  id: string;
  label: string;
  /** 'action' items are commands (run a test…); others are navigation targets. */
  kind: 'action' | 'service' | 'operation' | 'test';
  protocol?: Protocol;
  hint?: string;
  keywords?: string[];
}

export interface TableColumn {
  key: string;
  label: string;
  align?: 'start' | 'end';
  mono?: boolean;
  width?: string;
}

export interface WorkflowSource {
  name: string;
  protocol: Protocol;
}

export interface WorkflowStep {
  stepId: string;
  source: string;
  operation: string;
  criteria: 'pass' | 'fail' | 'pending';
  contract: 'pass' | 'fail' | 'pending';
  retry?: string;
}

export interface WorkflowThread {
  from: string;
  to: string;
  expression: string;
}

export interface WorkflowGoto {
  from: string;
  to: string;
}

export const PROTOCOL_TOKEN: Record<Protocol, string> = {
  REST: 'proto-rest',
  SOAP: 'proto-soap',
  EVENT: 'proto-event',
  gRPC: 'proto-grpc',
  GRAPHQL: 'proto-graphql',
  DIRECT: 'proto-direct',
};

export function parseJson<T>(value: T | string | undefined, fallback: T): T {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
