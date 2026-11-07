/**
 * Agents (A2A) wire <-> domain. The `from*`/`toAgent*` readers accept what a plain A2A 1.0 server or a Microcks
 * without the demo extensions answers (no `metadata.microcks`, no `/api/agents/...` payload) and fill the gaps; the
 * `to*` writers are used by the MSW handlers to serialise the in-memory agents.
 */
import {
  AGENT_TRANSPORT_NAMES,
  agentElapsedMs,
  agentRunPassed,
  type AgentCard,
  type AgentProfile,
  type AgentSkill,
  type AgentTask,
  type AgentTaskState,
  type AgentTestDefaults,
  type AgentTestRunWithDetails,
  type AgentTestSetup,
  type AgentTransport,
  type Conversation,
  type TaskArtifact,
  type TaskMessage,
  type TransportId,
} from '@/domain/agents';
import type { MicrocksService } from '@/infrastructure/http/catalog/dto';
import { toIsoDate, type MicrocksTestResult } from '@/infrastructure/http/testing/microcks';
import {
  A2A_RUNNER,
  type A2aArtifact,
  type A2aMessage,
  type A2aPart,
  type A2aTask,
  type DemoA2aConformance,
  type DemoAgentProfile,
  type DemoAgentTestDefaults,
  type MicrocksA2aTestRequest,
  type MicrocksTaskExtension,
} from './dto';

const STATES: readonly AgentTaskState[] = ['submitted', 'working', 'input-required', 'auth-required', 'completed', 'failed', 'rejected', 'canceled'];

/** `TASK_STATE_INPUT_REQUIRED` (A2A 1.0) or `input-required` (A2A 0.x) -> `input-required`. Unknown -> `submitted`. */
export function fromTaskStateWire(wire: string | undefined): AgentTaskState {
  const state = (wire ?? '').replace(/^TASK_STATE_/, '').toLowerCase().replaceAll('_', '-').replace('cancelled', 'canceled');
  return (STATES as readonly string[]).includes(state) ? (state as AgentTaskState) : 'submitted';
}

export function toTaskStateWire(state: AgentTaskState): string {
  return `TASK_STATE_${state.toUpperCase().replaceAll('-', '_')}`;
}

const BINDING_TO_TRANSPORT = { JSONRPC: 'JSON-RPC', 'HTTP+JSON': 'HTTP+JSON', GRPC: 'gRPC' } as const satisfies Record<AgentTransport['binding'], AgentTask['transport']>;
const TRANSPORT_TO_BINDING = { 'JSON-RPC': 'JSONRPC', 'HTTP+JSON': 'HTTP+JSON', gRPC: 'GRPC' } as const satisfies Record<AgentTask['transport'], AgentTransport['binding']>;
const BINDING_TO_ID: Record<AgentTransport['binding'], TransportId> = { JSONRPC: 'jsonrpc', 'HTTP+JSON': 'http', GRPC: 'grpc' };

/** An A2A 0.x part (`kind`, nested `file`) in the A2A 1.0 form; a 1.0 part is returned as is, without its metadata. */
export function normalizePart(part: A2aPart): A2aPart {
  const { kind, file, metadata, ...rest } = part;
  void kind;
  void metadata;
  if (!file) return rest;
  const filename = rest.filename ?? file.name;
  const mediaType = rest.mediaType ?? file.mediaType ?? file.mimeType;
  return {
    ...(file.bytes !== undefined ? { raw: file.bytes } : file.uri !== undefined ? { url: file.uri } : {}),
    ...rest,
    ...(filename !== undefined ? { filename } : {}),
    ...(mediaType !== undefined ? { mediaType } : {}),
  };
}

/** Approximate decoded size of base64 content. */
const base64Bytes = (raw: string): number => Math.floor((raw.replace(/[\s=]/g, '').length * 3) / 4);

/**
 * One part as a line of a history message. The domain message is text: a file part is written out explicitly
 * (`[file report.pdf · application/pdf · https://…]`, inline bytes by their size), a part with no known content as
 * `[unsupported part …]`, so nothing is dropped silently.
 */
export function partText(input: A2aPart): string {
  const part = normalizePart(input);
  if (part.text !== undefined) return part.text;
  if (part.data !== undefined) return JSON.stringify(part.data);
  const describe = (location: string) => `[file ${[part.filename, part.mediaType, location].filter(Boolean).join(' · ')}]`;
  if (part.url !== undefined) return describe(part.url);
  if (part.raw !== undefined) return describe(`${base64Bytes(part.raw)} bytes inline`);
  return `[unsupported part ${JSON.stringify(part)}]`;
}

/** The parts as the demo prints them: one data part is its pretty JSON, anything else the pretty parts (files included). */
function partsBody(parts: readonly A2aPart[]): string {
  const normal = parts.map(normalizePart);
  const [only] = normal;
  if (normal.length === 1 && only?.data !== undefined) return JSON.stringify(only.data, null, 2);
  return JSON.stringify(normal, null, 2);
}

function fromMessage(message: A2aMessage): TaskMessage {
  const role: TaskMessage['role'] =
    message.metadata?.microcks?.role === 'system' ? 'system' : message.role === 'ROLE_USER' || message.role === 'user' ? 'user' : message.role === 'ROLE_AGENT' || message.role === 'agent' ? 'agent' : 'system';
  return { role, text: (message.parts ?? []).map(partText).join(' · ') };
}

function fromArtifact(artifact: A2aArtifact, index: number): TaskArtifact {
  const ext = artifact.metadata?.microcks;
  const out: TaskArtifact = { name: artifact.name ?? artifact.artifactId ?? `artifact-${index + 1}`, id: artifact.artifactId ?? `artifact-${index + 1}`, body: ext?.body ?? partsBody(artifact.parts ?? []) };
  if (ext?.note !== undefined) out.note = ext.note;
  return out;
}

/** A2A 1.0 `Task` -> domain task. `now` dates the last update when the server does not say how long ago it was. */
export function fromA2aTask(task: A2aTask, now: Date): AgentTask {
  const ext: MicrocksTaskExtension = task.metadata?.microcks ?? {};
  const state = fromTaskStateWire(task.status?.state);
  const updatedAt = task.status?.timestamp ?? '';
  const parsed = Date.parse(updatedAt);
  const out: AgentTask = {
    id: task.id,
    contextId: task.contextId ?? '',
    skillId: ext.skillId ?? '',
    state,
    transport: ext.protocolBinding ? BINDING_TO_TRANSPORT[ext.protocolBinding] : 'JSON-RPC',
    method: ext.method ?? 'SendMessage',
    client: ext.client ?? '',
    updatedSecondsAgo: ext.updatedSecondsAgo ?? (Number.isNaN(parsed) ? 0 : Math.max(0, Math.round((now.getTime() - parsed) / 1000))),
    live: ext.live ?? (state === 'submitted' || state === 'working'),
    history: (task.history ?? []).map(fromMessage),
    artifacts: (task.artifacts ?? []).map(fromArtifact),
    updatedAt,
  };
  if (ext.push !== undefined) out.push = ext.push;
  return out;
}

/** The demo prints artifact bodies as JSON: back to parts (an array of parts, else one data part, else one text part). */
function bodyParts(body: string): A2aPart[] {
  try {
    const value: unknown = JSON.parse(body);
    return Array.isArray(value) ? (value as A2aPart[]) : [{ data: value }];
  } catch {
    return [{ text: body }];
  }
}

/** Domain task -> A2A 1.0 `Task` with the Microcks extension (MSW handlers). */
export function toA2aTask(task: AgentTask): A2aTask {
  return {
    id: task.id,
    contextId: task.contextId,
    status: { state: toTaskStateWire(task.state), timestamp: task.updatedAt },
    history: task.history.map((m, i) => ({
      messageId: `${task.id}-m${i + 1}`,
      contextId: task.contextId,
      taskId: task.id,
      role: m.role === 'user' ? 'ROLE_USER' : 'ROLE_AGENT',
      parts: [{ text: m.text }],
      ...(m.role === 'system' ? { metadata: { microcks: { role: 'system' as const } } } : {}),
    })),
    artifacts: task.artifacts.map((a) => ({ artifactId: a.id, name: a.name, parts: bodyParts(a.body), metadata: { microcks: { body: a.body, ...(a.note !== undefined ? { note: a.note } : {}) } } })),
    metadata: {
      microcks: {
        skillId: task.skillId,
        protocolBinding: TRANSPORT_TO_BINDING[task.transport],
        method: task.method,
        client: task.client,
        live: task.live,
        updatedSecondsAgo: task.updatedSecondsAgo,
        ...(task.push !== undefined ? { push: task.push } : {}),
      },
    },
  };
}

/** `value`, completed with the keys of `defaults` it lacks (its own key order is kept: the card is printed as JSON). */
function withDefaults<T extends object>(value: Partial<T> | undefined, defaults: T): T {
  const out: Record<string, unknown> = { ...value };
  for (const [key, fallback] of Object.entries(defaults)) if (out[key] === undefined) out[key] = fallback;
  return out as T;
}

const EMPTY_CONVERSATION: Conversation = { id: 'fallback', skillId: '', contextId: '', taskId: '', method: 'SendMessage', length: '', turns: 0, streamed: false, match: '', steps: [] };

/** Microcks service (`type: 'A2A'`) + optional demo profile -> the agent. */
export function toAgentProfile(service: MicrocksService, ext: DemoAgentProfile = {}): AgentProfile {
  const card = withDefaults<AgentCard>(ext.card, {
    name: service.name,
    description: '',
    version: service.version,
    provider: { organization: '', url: '' },
    supportedInterfaces: [],
    capabilities: { streaming: false, pushNotifications: false, extensions: [], extendedAgentCard: false },
    securitySchemes: {},
    securityRequirements: [],
    defaultInputModes: [],
    defaultOutputModes: [],
    skills: [],
  });
  const transports: AgentTransport[] =
    ext.transports ??
    card.supportedInterfaces.map((i, n) => {
      const id = BINDING_TO_ID[i.protocolBinding];
      return { id, name: AGENT_TRANSPORT_NAMES[id], binding: i.protocolBinding, preferred: n === 0, mockUrl: i.url, publishedUrl: i.url, urlLabel: 'URL', streaming: '', more: '' };
    });
  const skills: AgentSkill[] =
    ext.skills ?? card.skills.map((s) => ({ ...s, calls: 0, conversationIds: [], lastTest: { result: 'pass' as const, title: '' } }));
  const labels = ext.labels ?? Object.entries(service.metadata?.labels ?? {}).map(([k, v]) => `${k}=${v}`);
  return {
    serviceId: service.id,
    name: ext.name ?? service.name,
    version: ext.version ?? service.version,
    description: ext.description ?? card.description,
    provider: ext.provider ?? card.provider.organization,
    specVersion: ext.specVersion ?? card.supportedInterfaces[0]?.protocolVersion ?? '',
    importedAt: ext.importedAt ?? (service.metadata ? toIsoDate(service.metadata.createdOn) : ''),
    importedFrom: ext.importedFrom ?? '',
    labels,
    card,
    skills,
    conversations: ext.conversations ?? [],
    fallback: ext.fallback ?? EMPTY_CONVERSATION,
    fallbackCalls: ext.fallbackCalls ?? 0,
    transports,
    mockCardUrl: ext.mockCardUrl ?? '',
    publishedCardUrl: ext.publishedCardUrl ?? ext.importedFrom ?? '',
    webhook: ext.webhook ?? { url: '', lastDelivery: '' },
    lastTest: ext.lastTest ?? { runId: '', result: 'passed' },
  };
}

/** The demo profile served by `GET /api/agents/{serviceId}` (name and version are the Microcks service's). */
export function toDemoAgentProfile(profile: AgentProfile): DemoAgentProfile {
  const { serviceId, ...rest } = profile;
  void serviceId;
  return rest;
}

/** The test form: the demo payload when there is one, else what the agent profile tells. */
export function toAgentTestDefaults(profile: AgentProfile, ext: DemoAgentTestDefaults = {}): AgentTestDefaults {
  const fallback: AgentTestDefaults = {
    setup: {
      serviceId: profile.serviceId,
      cardUrl: profile.publishedCardUrl,
      transports: profile.transports.map((t) => t.id),
      conversations: profile.conversations.map((c) => c.id),
      secret: '',
      timeoutMs: 15000,
      textMode: 'contains',
      dataSchema: true,
    },
    transports: profile.transports.map((t) => ({ id: t.id, label: AGENT_TRANSPORT_NAMES[t.id], sub: t.name, url: t.publishedUrl, preferred: t.preferred })),
    conversations: profile.conversations.map((c) => ({
      id: c.id, skillId: c.skillId, turns: String(c.turns), expect: 'completed', prompt: '', lifecycle: '', contains: '', regex: '', artifact: '', ms: { jsonrpc: 0, http: 0, grpc: 0 },
    })),
    secrets: [],
  };
  const out: AgentTestDefaults = {
    setup: { ...fallback.setup, ...ext.setup, serviceId: profile.serviceId },
    transports: ext.transports ?? fallback.transports,
    conversations: ext.conversations ?? fallback.conversations,
    secrets: ext.secrets ?? fallback.secrets,
  };
  if (ext.nextRunId !== undefined) out.nextRunId = ext.nextRunId;
  return out;
}

/** Setup -> Microcks `TestRequest` with its A2A part. */
export function toA2aTestRequest(setup: AgentTestSetup): MicrocksA2aTestRequest {
  return {
    serviceId: setup.serviceId,
    testEndpoint: setup.cardUrl,
    runnerType: A2A_RUNNER,
    timeout: setup.timeoutMs,
    ...(setup.secret ? { secretName: setup.secret } : {}),
    a2a: { transports: setup.transports, conversations: setup.conversations, textMode: setup.textMode, dataSchema: setup.dataSchema },
  };
}

/** Microcks `TestRequest` -> setup; `defaults` fills a request without its A2A part (MSW handlers). */
export function fromA2aTestRequest(request: MicrocksA2aTestRequest, defaults: AgentTestSetup): AgentTestSetup {
  return {
    serviceId: request.serviceId,
    cardUrl: request.testEndpoint,
    transports: request.a2a?.transports ?? defaults.transports,
    conversations: request.a2a?.conversations ?? defaults.conversations,
    secret: request.secretName ?? '',
    timeoutMs: request.timeout,
    textMode: request.a2a?.textMode ?? defaults.textMode,
    dataSchema: request.a2a?.dataSchema ?? defaults.dataSchema,
  };
}

/** Run -> Microcks `TestResult`: one test case per matrix row, one step per transport (MSW handlers). */
export function toMicrocksA2aTestResult(run: AgentTestRunWithDetails): MicrocksTestResult {
  const rows = [...new Set(run.checks.map((c) => c.row))];
  return {
    id: run.id,
    version: 1,
    testNumber: Number(run.id) || 0,
    testDate: Date.parse(run.startedAt),
    testedEndpoint: run.setup.cardUrl,
    serviceId: run.setup.serviceId,
    elapsedTime: agentElapsedMs(run.checks),
    success: agentRunPassed(run.checks),
    inProgress: false,
    runnerType: A2A_RUNNER,
    timeout: run.setup.timeoutMs,
    ...(run.setup.secret ? { secretRef: { secretId: `secret-${run.setup.secret}`, name: run.setup.secret } } : {}),
    testCaseResults: rows.map((row) => {
      const checks = run.checks.filter((c) => c.row === row);
      return {
        operationName: row,
        success: checks.every((c) => c.result !== 'fail'),
        elapsedTime: checks.reduce((ms, c) => ms + c.ms, 0),
        testStepResults: checks.map((c) => ({ success: c.result !== 'fail', elapsedTime: c.ms, requestName: c.transport, ...(c.note ? { message: c.note } : {}) })),
      };
    }),
  };
}

/** What a run is known by before its matrix is read: the id, and the setup and start of the `TestResult`. */
export interface AgentRunHeader {
  id: string;
  setup?: AgentTestSetup;
  startedAt?: string;
}

const EMPTY_SETUP: AgentTestSetup = { serviceId: '', cardUrl: '', transports: [], conversations: [], secret: '', timeoutMs: 0, textMode: 'contains', dataSchema: false };

/** Conformance matrix (optional) + header -> run. Failures default to the failing cells. */
export function toAgentTestRun(header: AgentRunHeader, ext: DemoA2aConformance = {}): AgentTestRunWithDetails {
  const checks = ext.checks ?? [];
  return {
    id: ext.id ?? header.id,
    setup: { ...EMPTY_SETUP, ...header.setup, ...ext.setup },
    startedAt: ext.startedAt ?? header.startedAt ?? '',
    launchedBy: ext.launchedBy ?? '',
    checks,
    details: ext.details ?? {},
    failures:
      ext.failures ??
      checks.flatMap((c) => (c.result === 'fail' && c.transport !== '*' ? [{ row: c.row, transport: c.transport, cause: c.note ?? '' }] : [])),
  };
}

/** The matrix served by `GET /api/tests/{id}/a2a` (MSW handlers). */
export function toA2aConformance(run: AgentTestRunWithDetails): DemoA2aConformance {
  return { ...run };
}
