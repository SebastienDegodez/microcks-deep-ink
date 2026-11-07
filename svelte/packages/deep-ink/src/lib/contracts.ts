import type { Outcome, Protocol } from './types.js';

export const PROTOCOL_ATTR: Record<Protocol, string> = {
  REST: 'rest', SOAP: 'soap', EVENT: 'event', gRPC: 'grpc',
  GRAPHQL: 'graphql', DIRECT: 'direct', A2A: 'a2a',
};

export const OUTCOME_WORD: Record<Outcome, string> = {
  conformant: 'Conformant', failed: 'Failed', partial: 'Partial',
  running: 'Running', never: 'Never tested',
};
