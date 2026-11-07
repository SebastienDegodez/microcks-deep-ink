export type CommandProtocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT' | 'A2A';

export interface CommandItem {
  id: string;
  label: string;
  /** 'action' items are commands (run a test…); others are navigation targets. */
  kind: 'action' | 'service' | 'operation' | 'test';
  protocol?: CommandProtocol;
  hint?: string;
  keywords?: string[];
}
