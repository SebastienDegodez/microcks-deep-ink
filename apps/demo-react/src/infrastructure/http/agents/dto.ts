/**
 * Wire types of the agents (A2A) API.
 *
 * Microcks API v1.15 (`api/microcks-openapi-v1.15.yaml`) has no A2A endpoint, no `A2A` service type and no A2A test
 * runner. An agent is a Microcks service (`GET /services/{id}`, `type: 'A2A'`, see `@/infrastructure/http/catalog/dto`)
 * and its conformance test is a Microcks test (`POST /tests`, `runnerType: 'A2A_CONFORMANCE'`, see
 * `@/infrastructure/http/testing/microcks`); both type values are demo extensions already declared there.
 *
 * Proposition v2 / not in Microcks API: every `/api/agents/...` route, `GET /api/tests/{id}/a2a` and the `a2a` member
 * of the `TestRequest`. The task routes mirror the A2A 1.0 HTTP+JSON binding of the agent (`GET /tasks`,
 * `POST /tasks/{id}:cancel`) and answer A2A 1.0 `Task` objects (proto JSON); what Microcks would add about a task
 * (skill, transport, client) travels in `metadata.microcks`, which a plain A2A server does not send: every member of
 * it is optional.
 */
import type { AgentCard, AgentCheck, AgentCheckDetail, AgentProfile, AgentTestDefaults, AgentTestSetup, TransportId } from '@/domain/agents';
import type { MicrocksTestRequest } from '@/infrastructure/http/testing/microcks';

// --- A2A 1.0 (a2a.proto, JSON form) -------------------------------------------------------------------------------

/** `TaskState`. Older payloads (A2A 0.x) send the lower-case names (`input-required`): both are read. */
export type A2aTaskStateWire =
  | 'TASK_STATE_UNSPECIFIED'
  | 'TASK_STATE_SUBMITTED'
  | 'TASK_STATE_WORKING'
  | 'TASK_STATE_INPUT_REQUIRED'
  | 'TASK_STATE_AUTH_REQUIRED'
  | 'TASK_STATE_COMPLETED'
  | 'TASK_STATE_FAILED'
  | 'TASK_STATE_REJECTED'
  | 'TASK_STATE_CANCELED';

/** `Part`: one of `text`, `data` or `file` (A2A 0.x also sends a `kind` discriminator). */
export interface A2aPart {
  kind?: string;
  text?: string;
  data?: unknown;
  file?: { name?: string; mediaType?: string; uri?: string };
  metadata?: Record<string, unknown>;
}

/** Proposition v2 / not in Microcks API: `metadata.microcks` of a history message. */
export interface MicrocksMessageExtension {
  /** A note of the mock (`CancelTask by MA from this page`) rather than a message of the conversation. */
  role?: 'system';
}

/** `Message`. */
export interface A2aMessage {
  messageId?: string;
  contextId?: string;
  taskId?: string;
  role?: 'ROLE_UNSPECIFIED' | 'ROLE_USER' | 'ROLE_AGENT' | 'user' | 'agent';
  parts?: A2aPart[];
  metadata?: { microcks?: MicrocksMessageExtension } & Record<string, unknown>;
}

/** Proposition v2 / not in Microcks API: `metadata.microcks` of an artifact. */
export interface MicrocksArtifactExtension {
  /** The parts as the demo prints them. */
  body?: string;
  /** Streaming note (`chunk 1 · append false`). */
  note?: string;
}

/** `Artifact`. */
export interface A2aArtifact {
  artifactId?: string;
  name?: string;
  description?: string;
  parts?: A2aPart[];
  metadata?: { microcks?: MicrocksArtifactExtension } & Record<string, unknown>;
}

/** `TaskStatus`. */
export interface A2aTaskStatus {
  state?: A2aTaskStateWire | string;
  message?: A2aMessage;
  /** ISO 8601. */
  timestamp?: string;
}

/** Proposition v2 / not in Microcks API: what Microcks records about a task its mock created. */
export interface MicrocksTaskExtension {
  skillId?: string;
  /** `protocolBinding` the client used. */
  protocolBinding?: 'JSONRPC' | 'HTTP+JSON' | 'GRPC';
  /** A2A method of the call (`SendStreamingMessage`). */
  method?: string;
  /** Client that called the mock. */
  client?: string;
  /** The mock is still streaming this task. */
  live?: boolean;
  /** A push notification config is registered. */
  push?: boolean;
  /** Seconds since the last update, on the server's clock. */
  updatedSecondsAgo?: number;
}

/** `Task`. */
export interface A2aTask {
  id: string;
  contextId?: string;
  status?: A2aTaskStatus;
  artifacts?: A2aArtifact[];
  history?: A2aMessage[];
  metadata?: { microcks?: MicrocksTaskExtension } & Record<string, unknown>;
}

/** `ListTasksResponse`. */
export interface A2aListTasksResponse {
  tasks?: A2aTask[];
  nextPageToken?: string;
  pageSize?: number;
  totalSize?: number;
}

/** `CancelTaskRequest` body of the HTTP+JSON binding (who cancels, in the Microcks metadata). */
export interface A2aCancelTaskRequest {
  metadata?: { microcks?: { by?: string } };
}

// --- Proposition v2 / not in Microcks API ---------------------------------------------------------------------------

/**
 * `GET /api/agents/{serviceId}`: what the demo shows about an agent beyond the Microcks service (name and version come
 * from `GET /services/{id}`). Every member is optional: the adapter fills the gaps.
 */
export type DemoAgentProfile = Partial<Omit<AgentProfile, 'serviceId' | 'card'>> & { card?: Partial<AgentCard> };

/** `GET /api/agents/{serviceId}/test-defaults`: the agent test form. */
export type DemoAgentTestDefaults = Partial<Omit<AgentTestDefaults, 'setup'>> & { setup?: Partial<AgentTestSetup> };

/** The A2A part of a Microcks `TestRequest`. */
export interface DemoA2aTestRequestExtension {
  transports: TransportId[];
  conversations: string[];
  textMode: AgentTestSetup['textMode'];
  dataSchema: boolean;
}

/** Microcks `TestRequest` of an A2A conformance test (`POST /api/tests`). */
export type MicrocksA2aTestRequest = MicrocksTestRequest & { a2a?: DemoA2aTestRequestExtension };

/** `GET /api/tests/{id}/a2a`: the conformance matrix of an `A2A_CONFORMANCE` test. */
export interface DemoA2aConformance {
  id?: string;
  setup?: Partial<AgentTestSetup>;
  /** ISO start time. */
  startedAt?: string;
  launchedBy?: string;
  checks?: AgentCheck[];
  details?: Record<string, AgentCheckDetail>;
  failures?: { row: string; transport: TransportId; cause: string }[];
}

/** Runner type of the conformance test (a demo value of `TestRunnerType`). */
export const A2A_RUNNER = 'A2A_CONFORMANCE';
