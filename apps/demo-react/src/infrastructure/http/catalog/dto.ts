/**
 * Wire types of the catalogue API.
 *
 * `Microcks*` types follow the Microcks REST API, OpenAPI `api/microcks-openapi-v1.15.yaml` (Microcks API v1.15.0,
 * https://github.com/microcks/microcks/blob/master/api/microcks-openapi-v1.15.yaml): `components/schemas/Service`,
 * `ServiceView`, `Operation`, `Metadata`, `Exchange` (`RequestResponsePair` | `UnidirectionalEvent`), `Request`,
 * `Response`, `EventMessage`, `Parameter`, `Counter` and `LabelsMap`. Only the fields the demo reads are declared.
 *
 * `Demo*` types are the payloads of the demo-only endpoints (`/api/demo/...`): proposition v2 / not in Microcks API.
 */
import type { Behavior, CommandItem, ServiceDetails, WorkflowUsage } from '@/domain/catalog';
import type { TestStatus } from '@/domain/shared';

/** `Service.type` enum of the spec, plus `A2A` (proposition v2 / not in Microcks API: no Microcks service type for agents). */
export type MicrocksServiceType = 'REST' | 'SOAP_HTTP' | 'GENERIC_REST' | 'GENERIC_EVENT' | 'EVENT' | 'GRPC' | 'GRAPHQL' | 'A2A';

/** `components/schemas/Metadata`. Dates are epoch milliseconds. */
export interface MicrocksMetadata {
  createdOn: number;
  lastUpdate: number;
  annotations?: Record<string, string>;
  labels?: Record<string, string>;
}

/** `components/schemas/Operation`. `name` is `<METHOD> <path>` (`GET /pastries/{name}`), as Microcks names REST operations. */
export interface MicrocksOperation {
  name: string;
  method: string;
  dispatcher?: string;
  dispatcherRules?: string;
  defaultDelay?: number;
  resourcePaths?: string[];
}

/** `components/schemas/Service`. */
export interface MicrocksService {
  id: string;
  name: string;
  version: string;
  type: MicrocksServiceType;
  sourceArtifact: string;
  metadata?: MicrocksMetadata;
  operations?: MicrocksOperation[];
}

/** `components/schemas/Parameter`. */
export interface MicrocksParameter {
  name: string;
  value: string;
}

/** `components/schemas/Header`. */
export interface MicrocksHeader {
  name: string;
  values: string[];
}

/** `components/schemas/Message` (common part of `Request`, `Response` and `EventMessage`). */
interface MicrocksMessage {
  id?: string;
  name: string;
  operationId: string;
  content?: string;
  headers?: MicrocksHeader[];
}

/** `components/schemas/Request`. */
export interface MicrocksRequest extends MicrocksMessage {
  responseId?: string;
  queryParameters?: MicrocksParameter[];
}

/** `components/schemas/Response`. `status` is a string in the spec (`"200"`). */
export interface MicrocksResponse extends MicrocksMessage {
  status?: string;
  mediaType?: string;
  dispatchCriteria?: string;
  isFault?: boolean;
}

/** `components/schemas/EventMessage`. */
export interface MicrocksEventMessage extends MicrocksMessage {
  id: string;
  mediaType: string;
  dispatchCriteria?: string;
}

/** `components/schemas/RequestResponsePair` (discriminator `type: reqRespPair`). */
export interface MicrocksRequestResponsePair {
  type: 'reqRespPair';
  request: MicrocksRequest;
  response: MicrocksResponse;
}

/** `components/schemas/UnidirectionalEvent` (discriminator `type: unidirEvent`). */
export interface MicrocksUnidirectionalEvent {
  type: 'unidirEvent';
  eventMessage: MicrocksEventMessage;
}

/** `components/schemas/Exchange`. */
export type MicrocksExchange = MicrocksRequestResponsePair | MicrocksUnidirectionalEvent;

/** `components/schemas/ServiceView`: `GET /services/{id}?messages=true`. Keys of `messagesMap` are operation names. */
export interface MicrocksServiceView {
  service: MicrocksService;
  messagesMap: Record<string, MicrocksExchange[]>;
}

/** `components/schemas/Counter`: `GET /services/count`. */
export interface MicrocksCounter {
  counter: number;
}

/** `components/schemas/LabelsMap`: `GET /services/labels`. Keys are label keys, values the used values. */
export type MicrocksLabelsMap = Record<string, string[]>;

// ---------------------------------------------------------------------------------------------------------------
// Demo-only payloads: proposition v2 / not in Microcks API.
// ---------------------------------------------------------------------------------------------------------------

/** Review state of an AI-proposed example (Microcks has no review flow for Copilot samples). */
export interface DemoExampleReview {
  aiGenerated?: boolean;
  reviewState?: 'pending' | 'accepted';
}

/** What the demo shows about an operation beyond Microcks' `Operation`. */
export interface DemoOperationExtras {
  id: string;
  summary: string;
  calls: number;
  spark: number[];
  mcpTool?: string;
  schemaSummary?: string;
  /** Review flags by example id (only the examples that have some). */
  reviews?: Record<string, DemoExampleReview>;
}

/**
 * `GET /api/demo/services` (one per service) and `GET /api/demo/services/{id}`: test status, conformance, traffic
 * and contract format of a service, and its operations' extras keyed by Microcks operation name.
 */
export interface DemoServiceExtras {
  id: string;
  format: string;
  exampleCount?: number;
  lastResults: ('pass' | 'fail')[] | null;
  testStatus: TestStatus;
  lastTest?: { runId: string; when: string; checks?: { passed: number; total: number } };
  conformance: number | null;
  calls24h: number;
  mcp: boolean;
  operations: Record<string, DemoOperationExtras>;
}

/** Body item of `POST /api/demo/services/{id}/operations/{opId}/examples`. */
export interface DemoExampleInput extends DemoExampleReview {
  exchange: MicrocksExchange;
}

/** `GET|PUT /api/demo/services/{id}/operations/{opId}/behavior`: the full Behavior (Microcks' OperationOverrideDTO covers part of it only). */
export type DemoBehavior = Behavior;
/** `GET /api/demo/services/{id}/details`. */
export type DemoServiceDetails = ServiceDetails;
/** `GET /api/demo/services/{id}/workflow-usages`. */
export type DemoWorkflowUsages = WorkflowUsage[];
/** `GET /api/demo/commands`. */
export type DemoCommands = CommandItem[];
