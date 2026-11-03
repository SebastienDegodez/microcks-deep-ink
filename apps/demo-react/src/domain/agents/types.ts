/** A2A (Agent2Agent) domain: an Agent Card, its skills, the scripted conversations the mock replays and the tasks it creates. */

/** Task lifecycle states of the A2A spec 1.0. */
export type AgentTaskState = 'submitted' | 'working' | 'input-required' | 'auth-required' | 'completed' | 'failed' | 'rejected' | 'canceled';

export const TERMINAL_TASK_STATES: readonly AgentTaskState[] = ['completed', 'failed', 'rejected', 'canceled'];

/** Wire name of a state in the v1.0 payloads: `input-required` is `TASK_STATE_INPUT_REQUIRED`. */
export function taskStateWire(state: AgentTaskState): string {
  return `TASK_STATE_${state.toUpperCase().replace('-', '_')}`;
}

/** Interrupted states: the task waits for the client (a reply or credentials) and is not terminal. */
export const INTERRUPTED_TASK_STATES: readonly AgentTaskState[] = ['input-required', 'auth-required'];

export function isTerminalTaskState(state: AgentTaskState): boolean {
  return TERMINAL_TASK_STATES.includes(state);
}

/** The three protocol bindings of a2a.proto, all served by the mock from the same conversations. */
export type TransportId = 'jsonrpc' | 'http' | 'grpc';

export interface AgentTransport {
  id: TransportId;
  name: string;
  /** `protocolBinding` value of a supportedInterfaces entry. */
  binding: 'JSONRPC' | 'HTTP+JSON' | 'GRPC';
  /** Listed first in supportedInterfaces. */
  preferred: boolean;
  /** URL served by the mock. */
  mockUrl: string;
  /** URL declared by the published card. */
  publishedUrl: string;
  urlLabel: string;
  /** Short description of the streaming mechanism. */
  streaming: string;
  /** Other methods served on this binding. */
  more: string;
}

export interface AgentSkill {
  id: string;
  name: string;
  /** Mock calls over 24 h. */
  calls: number;
  description: string;
  tags: string[];
  inputModes: string[];
  outputModes: string[];
  examples: string[];
  /** Conversation ids (APIExamples) keyed by this skill. */
  conversationIds: string[];
  /** Result of the skill in the last agent test. */
  lastTest: { result: 'pass' | 'fail'; title: string };
  /** Service the agent calls to answer, served by its own Microcks mock. */
  usesService?: string;
}

export type ScriptPart = { kind: 'text'; text: string } | { kind: 'data'; body: string };

export interface ArtifactChunk {
  n: number;
  at: string;
  text: string;
  append: boolean;
  last: boolean;
}

export type ScriptStep =
  | { kind: 'state'; state: AgentTaskState; at: string; message?: string; event?: string }
  | { kind: 'user'; at: string; messageId: string; meta: string; parts: ScriptPart[] }
  | { kind: 'call'; at: string; text: string }
  | { kind: 'turn'; at: string; title: string; text: string }
  | { kind: 'artifact'; at: string; name: string; artifactId: string; parts: ScriptPart[] }
  | { kind: 'chunks'; at: string; name: string; artifactId: string; chunks: ArtifactChunk[] };

/** One scripted conversation of the APIExamples artifact. */
export interface Conversation {
  id: string;
  /** Empty for the fallback conversation. */
  skillId: string;
  contextId: string;
  taskId: string;
  method: 'SendMessage' | 'SendStreamingMessage';
  length: string;
  turns: number;
  streamed: boolean;
  /** How the dispatcher picks this conversation. */
  match: string;
  steps: ScriptStep[];
}

export interface AgentInterface {
  url: string;
  protocolBinding: AgentTransport['binding'];
  protocolVersion: string;
}

/** Agent Card as published by the agent (JSON document of the spec). */
export interface AgentCard {
  name: string;
  description: string;
  version: string;
  provider: { organization: string; url: string };
  supportedInterfaces: AgentInterface[];
  capabilities: { streaming: boolean; pushNotifications: boolean; extensions: string[]; extendedAgentCard: boolean };
  securitySchemes: Record<string, unknown>;
  securityRequirements: Record<string, string[]>[];
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: {
    id: string;
    name: string;
    description: string;
    tags: string[];
    examples: string[];
    inputModes: string[];
    outputModes: string[];
  }[];
}

export interface AgentProfile {
  serviceId: string;
  name: string;
  version: string;
  description: string;
  provider: string;
  specVersion: string;
  importedAt: string;
  /** URL the card was fetched from. */
  importedFrom: string;
  labels: string[];
  card: AgentCard;
  skills: AgentSkill[];
  conversations: Conversation[];
  /** Conversation answered when no skill matches. */
  fallback: Conversation;
  transports: AgentTransport[];
  /** Mock URL of the card. */
  mockCardUrl: string;
  publishedCardUrl: string;
  webhook: { url: string; lastDelivery: string };
  lastTest: { runId: string; result: 'passed' | 'failed' };
}

export interface TaskMessage {
  role: 'user' | 'agent' | 'system';
  text: string;
}

export interface TaskArtifact {
  name: string;
  id: string;
  /** JSON body (parts) as text. */
  body: string;
  note?: string;
}

/** A task created on the mock. */
export interface AgentTask {
  id: string;
  contextId: string;
  /** Empty when no skill matched. */
  skillId: string;
  state: AgentTaskState;
  transport: 'JSON-RPC' | 'HTTP+JSON' | 'gRPC';
  method: string;
  client: string;
  /** Seconds since the last update. */
  updatedSecondsAgo: number;
  live: boolean;
  history: TaskMessage[];
  artifacts: TaskArtifact[];
  push?: boolean;
  /** ISO time of the last update. */
  updatedAt: string;
}
