/**
 * Pure mappings between the domain and the catalogue wire types (`./dto.ts`), both ways: the HTTP adapters read
 * Microcks DTOs into the domain (`from*`), the mock API serialises the in-memory domain into DTOs (`to*`).
 */
import type { LabelCount } from '@/domain/catalog';
import { labelToString, type Dispatcher, type Example, type Operation, type Protocol, type ServiceSummary } from '@/domain/shared';
import {
  AI_COPILOT_SOURCE,
  type DemoExampleReview,
  type DemoOperationExtras,
  type DemoServiceExtras,
  type MicrocksExchange,
  type MicrocksLabelsMap,
  type MicrocksOperation,
  type MicrocksService,
  type MicrocksServiceType,
} from './dto';

const TYPE_BY_PROTOCOL: Record<Protocol, MicrocksServiceType> = {
  REST: 'REST',
  SOAP: 'SOAP_HTTP',
  EVENT: 'EVENT',
  gRPC: 'GRPC',
  GRAPHQL: 'GRAPHQL',
  DIRECT: 'GENERIC_REST',
  A2A: 'A2A',
};

const PROTOCOL_BY_TYPE: Record<MicrocksServiceType, Protocol> = {
  REST: 'REST',
  SOAP_HTTP: 'SOAP',
  EVENT: 'EVENT',
  GENERIC_EVENT: 'EVENT',
  GRPC: 'gRPC',
  GRAPHQL: 'GRAPHQL',
  GENERIC_REST: 'DIRECT',
  A2A: 'A2A',
};

export const toServiceType = (protocol: Protocol): MicrocksServiceType => TYPE_BY_PROTOCOL[protocol];
export const fromServiceType = (type: MicrocksServiceType): Protocol => PROTOCOL_BY_TYPE[type] ?? 'REST';

/** Epoch milliseconds (Microcks `Metadata` dates) -> ISO-8601, without the `.000` of whole seconds (as the seeds write them). */
export function epochToIso(ms: number): string {
  return new Date(ms).toISOString().replace('.000Z', 'Z');
}

/** Microcks' operation name: `<METHOD> <path>` (`GET /pastries/{name}`). */
export const operationName = (operation: Pick<Operation, 'method' | 'path'>): string => `${operation.method} ${operation.path}`;

// --- domain -> DTO (the mock API) ---------------------------------------------------------------------------------

export function toOperationDto(operation: Operation): MicrocksOperation {
  return {
    name: operationName(operation),
    method: operation.method,
    dispatcher: operation.dispatcher,
    dispatcherRules: operation.rule,
    defaultDelay: operation.delayMs,
  };
}

export function toServiceDto(service: ServiceSummary, operations: Operation[], sourceArtifact: string): MicrocksService {
  const lastUpdate = Date.parse(service.updatedAt);
  return {
    id: service.id,
    name: service.name,
    version: service.version,
    type: toServiceType(service.protocol),
    sourceArtifact,
    metadata: {
      createdOn: lastUpdate,
      lastUpdate,
      labels: Object.fromEntries(service.labels.map((l) => [l.key, l.value])),
    },
    operations: operations.map(toOperationDto),
  };
}

const reviewOf = (example: Example): DemoExampleReview | undefined =>
  example.aiGenerated !== undefined || example.reviewState
    ? { ...(example.aiGenerated !== undefined ? { aiGenerated: example.aiGenerated } : {}), ...(example.reviewState ? { reviewState: example.reviewState } : {}) }
    : undefined;

export function toOperationExtras(operation: Operation, examples: Example[] = []): DemoOperationExtras {
  const reviews = Object.fromEntries(examples.flatMap((e) => (reviewOf(e) ? [[e.id, reviewOf(e)!]] : [])));
  return {
    id: operation.id,
    summary: operation.summary,
    calls: operation.calls,
    spark: operation.spark,
    ...(operation.mcpTool !== undefined ? { mcpTool: operation.mcpTool } : {}),
    ...(operation.schemaSummary !== undefined ? { schemaSummary: operation.schemaSummary } : {}),
    ...(Object.keys(reviews).length > 0 ? { reviews } : {}),
  };
}

/** `examplesByOperation`: examples by domain operation id (only needed for their review flags). */
export function toServiceExtras(service: ServiceSummary, operations: Operation[], examplesByOperation: Record<string, Example[]> = {}): DemoServiceExtras {
  return {
    id: service.id,
    format: service.format,
    ...(service.exampleCount !== undefined ? { exampleCount: service.exampleCount } : {}),
    lastResults: service.lastResults,
    testStatus: service.testStatus,
    ...(service.lastTest ? { lastTest: service.lastTest } : {}),
    conformance: service.conformance,
    calls24h: service.calls24h,
    mcp: service.mcp,
    operations: Object.fromEntries(operations.map((o) => [operationName(o), toOperationExtras(o, examplesByOperation[o.id])])),
  };
}

/**
 * An example as a Microcks exchange: a request/response pair, or an event message for the examples of an event API
 * that only carry a message (no parameter, no request body, status 200).
 */
export function toExchange(example: Example, operation: string, protocol?: Protocol): MicrocksExchange {
  const params = Object.entries(example.request.params);
  const source = example.aiGenerated ? { sourceArtifact: AI_COPILOT_SOURCE } : {};
  if (protocol === 'EVENT' && params.length === 0 && example.request.body === undefined && example.response.status === 200) {
    return {
      type: 'unidirEvent',
      eventMessage: { id: example.id, name: example.name, operationId: operation, mediaType: 'application/json', content: example.response.body, ...source },
    };
  }
  return {
    type: 'reqRespPair',
    request: {
      id: `${example.id}-request`,
      name: example.name,
      operationId: operation,
      responseId: example.id,
      queryParameters: params.map(([name, value]) => ({ name, value })),
      ...(example.request.body !== undefined ? { content: example.request.body } : {}),
      ...source,
    },
    response: {
      id: example.id,
      name: example.name,
      operationId: operation,
      status: String(example.response.status),
      mediaType: 'application/json',
      content: example.response.body,
      ...source,
    },
  };
}

/** `GET /services/labels`: every used value of every label key. */
export function toLabelsMap(services: ServiceSummary[]): MicrocksLabelsMap {
  const map: MicrocksLabelsMap = {};
  for (const label of services.flatMap((s) => s.labels)) {
    const values = (map[label.key] ??= []);
    if (!values.includes(label.value)) values.push(label.value);
  }
  return map;
}

// --- DTO -> domain (the HTTP adapters) ----------------------------------------------------------------------------

export function fromServiceDto(service: MicrocksService, extras: DemoServiceExtras): ServiceSummary {
  return {
    id: service.id,
    name: service.name,
    version: service.version,
    protocol: fromServiceType(service.type),
    format: extras.format,
    operationCount: service.operations?.length ?? 0,
    ...(extras.exampleCount !== undefined ? { exampleCount: extras.exampleCount } : {}),
    lastResults: extras.lastResults,
    labels: Object.entries(service.metadata?.labels ?? {}).map(([key, value]) => ({ key, value })),
    testStatus: extras.testStatus,
    ...(extras.lastTest ? { lastTest: extras.lastTest } : {}),
    conformance: extras.conformance,
    calls24h: extras.calls24h,
    updatedAt: epochToIso(service.metadata?.lastUpdate ?? 0),
    mcp: extras.mcp,
  };
}

export function fromOperationDto(operation: MicrocksOperation, extras: DemoOperationExtras | undefined): Operation {
  const prefix = `${operation.method} `;
  return {
    id: extras?.id ?? operation.name,
    method: operation.method,
    path: operation.name.startsWith(prefix) ? operation.name.slice(prefix.length) : operation.name,
    summary: extras?.summary ?? operation.name,
    calls: extras?.calls ?? 0,
    spark: extras?.spark ?? [],
    dispatcher: (operation.dispatcher ?? 'FALLBACK') as Dispatcher,
    rule: operation.dispatcherRules ?? '',
    delayMs: operation.defaultDelay ?? 0,
    ...(extras?.mcpTool !== undefined ? { mcpTool: extras.mcpTool } : {}),
    ...(extras?.schemaSummary !== undefined ? { schemaSummary: extras.schemaSummary } : {}),
  };
}

/**
 * An exchange as an example. Microcks marks the exchanges accepted through the AI Copilot with
 * `sourceArtifact: 'AI Copilot'`: they read as accepted AI examples unless the demo review flags say otherwise.
 */
export function fromExchange(exchange: MicrocksExchange, review: DemoExampleReview = {}): Example {
  const sources = exchange.type === 'unidirEvent' ? [exchange.eventMessage] : [exchange.request, exchange.response];
  const fromCopilot = sources.some((m) => m?.sourceArtifact === AI_COPILOT_SOURCE);
  const aiGenerated = review.aiGenerated ?? (fromCopilot ? true : undefined);
  const reviewState = review.reviewState ?? (fromCopilot ? ('accepted' as const) : undefined);
  const flags = {
    ...(aiGenerated !== undefined ? { aiGenerated } : {}),
    ...(reviewState ? { reviewState } : {}),
  };
  if (exchange.type === 'unidirEvent') {
    const message = exchange.eventMessage;
    return { id: message.id, name: message.name, request: { params: {} }, response: { status: 200, body: message.content ?? '' }, ...flags };
  }
  const { request, response } = exchange;
  return {
    id: response.id ?? request.responseId ?? response.name,
    name: response.name,
    request: {
      params: Object.fromEntries((request.queryParameters ?? []).map((p) => [p.name, p.value])),
      ...(request.content !== undefined ? { body: request.content } : {}),
    },
    response: { status: Number(response.status ?? 200), body: response.content ?? '' },
    ...flags,
  };
}

/**
 * Label counts: `GET /services/labels` gives the used `key=value` pairs, the services give how many carry each.
 * Sorted by `key=value`, as the in-memory catalogue.
 */
export function fromLabelsMap(labels: MicrocksLabelsMap, services: Pick<MicrocksService, 'metadata'>[]): LabelCount[] {
  const counts: LabelCount[] = Object.entries(labels).flatMap(([key, values]) =>
    values.map((value) => ({ label: { key, value }, count: services.filter((s) => s.metadata?.labels?.[key] === value).length })),
  );
  return counts.filter((c) => c.count > 0).sort((a, b) => labelToString(a.label).localeCompare(labelToString(b.label)));
}

// --- AI Copilot exchanges -----------------------------------------------------------------------------------------

/** Microcks service types whose operations exchange events (`UnidirectionalEvent`), not request/response pairs. */
export const isEventServiceType = (type: MicrocksServiceType | undefined): boolean => type === 'EVENT' || type === 'GENERIC_EVENT';

/** How Microcks dispatches an operation: `Operation.dispatcher` and `Operation.dispatcherRules`. */
export interface DispatchTarget {
  dispatcher?: string;
  dispatcherRules?: string;
}

/** The root dispatcher of a `FALLBACK`/`PROXY_FALLBACK` operation (its rules are JSON), else the operation's own. */
function rootDispatcher({ dispatcher, dispatcherRules = '' }: DispatchTarget): Required<DispatchTarget> {
  if ((dispatcher === 'FALLBACK' || dispatcher === 'PROXY_FALLBACK') && dispatcherRules.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(dispatcherRules) as DispatchTarget;
      return { dispatcher: parsed.dispatcher ?? '', dispatcherRules: parsed.dispatcherRules ?? '' };
    } catch {
      // Not JSON: dispatched as is.
    }
  }
  return { dispatcher: dispatcher ?? '', dispatcherRules };
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** `DispatchCriteriaHelper.buildFrom{Parts,Params}Map`: the params named in the rule, sorted by name. */
function criteriaOf(rule: string, params: Record<string, string>, separator: '/' | '?'): string {
  return Object.keys(params)
    .sort()
    .filter((name) => new RegExp(`(^|[^-])\\b${escapeRegExp(name)}\\b([^-]|$)`).test(rule))
    .map((name) => `${separator}${name}=${params[name]}`)
    .join('');
}

/**
 * The `dispatchCriteria` Microcks computes for a request (`AICopilotHelper`, `DispatchCriteriaHelper`): what the mock
 * matches an incoming call against. `URI_PARTS` -> `/name=Tarte Tatin`, `URI_PARAMS` -> `?size=S`, `URI_ELEMENTS` ->
 * both; undefined for the dispatchers that read the body or a script.
 */
export function dispatchCriteriaOf(target: DispatchTarget, params: Record<string, string>): string | undefined {
  const { dispatcher, dispatcherRules } = rootDispatcher(target);
  const [parts = '', query = ''] = dispatcherRules.includes('??') ? dispatcherRules.split('??') : [dispatcherRules, dispatcherRules];
  switch (dispatcher) {
    case 'URI_PARTS':
      return criteriaOf(parts, params, '/');
    case 'URI_PARAMS':
      return criteriaOf(query, params, '?');
    case 'URI_ELEMENTS':
      return criteriaOf(parts, params, '/') + criteriaOf(query, params, '?');
    default:
      return undefined;
  }
}

/**
 * An example as the exchange of Microcks' AI Copilot (`GET` answer, `POST /copilot/samples/{id}` body): an
 * `UnidirectionalEvent` for an event operation, else a `RequestResponsePair` whose response carries the dispatch
 * criteria Microcks serves it with. Ids are kept (the demo reads them back), the `AI Copilot` source is Microcks' job.
 */
export function toCopilotExchange(example: Example, operation: string, target: DispatchTarget & { event: boolean }): MicrocksExchange {
  if (target.event) {
    return {
      type: 'unidirEvent',
      eventMessage: { id: example.id, name: example.name, operationId: operation, mediaType: 'application/json', content: example.response.body },
    };
  }
  const params = example.request.params;
  const dispatchCriteria = dispatchCriteriaOf(target, params);
  return {
    type: 'reqRespPair',
    request: {
      id: `${example.id}-request`,
      name: example.name,
      operationId: operation,
      responseId: example.id,
      queryParameters: Object.entries(params).map(([name, value]) => ({ name, value })),
      ...(example.request.body !== undefined ? { content: example.request.body } : {}),
    },
    response: {
      id: example.id,
      name: example.name,
      operationId: operation,
      status: String(example.response.status),
      mediaType: 'application/json',
      content: example.response.body,
      ...(dispatchCriteria !== undefined ? { dispatchCriteria } : {}),
    },
  };
}
