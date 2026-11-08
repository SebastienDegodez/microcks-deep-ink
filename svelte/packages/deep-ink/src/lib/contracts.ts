import type { Outcome, Protocol } from './types.js';

export const PROTOCOL_ATTR: Record<Protocol, string> = {
  REST: 'rest', SOAP: 'soap', EVENT: 'event', gRPC: 'grpc',
  GRAPHQL: 'graphql', DIRECT: 'direct', A2A: 'a2a',
};

export const OUTCOME_WORD: Record<Outcome, string> = {
  conformant: 'Conformant', failed: 'Failed', partial: 'Partial',
  running: 'Running', never: 'Never tested',
};


export interface LoomInput { name: string; expression?: string; value?: string }
export interface LoomOutput { name: string; value?: string }
export type LoomProtocol = Protocol;
export type LoomStepStatus = 'passed' | 'failed' | 'not-run';
export type LoomCheckState = 'passed' | 'failed' | 'off' | 'not-evaluated';
export interface LoomSource { name: string; type: 'openapi' | 'asyncapi'; protocol: LoomProtocol; linked: boolean; serviceLabel?: string }
export interface LoomCheck { label: string; state: 'pass' | 'fail' | 'skip' | 'idle' }
export interface LoomDrop { to: string; label: string; idle?: boolean; bad?: string }
export type LoomAction =
  | { type: 'end'; name: string; on: 'success' | 'failure'; criteria: string; taken?: boolean; label?: string; runLabel?: string }
  | { type: 'retry'; name: string; on: 'failure'; retryAfter: number; retryLimit: number; applied?: boolean; runLabel?: string };
export interface LoomStep {
  stepId: string; source: string; operation: string; method?: string; path?: string; result?: string; dependsOn?: string[];
  status?: LoomStepStatus; attempts?: number;
  checks?: LoomCheck[] | { successCriteria: LoomCheckState; schemaValidation?: LoomCheckState };
  actions?: LoomAction[];
}
export interface LoomThread { id?: string; from: string; to?: string; expression: string; value?: string; missing?: boolean; drops?: LoomDrop[] }
