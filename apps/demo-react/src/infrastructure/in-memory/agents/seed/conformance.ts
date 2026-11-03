import {
  cellKey,
  planChecks,
  type AgentCheck,
  type AgentCheckDetail,
  type AgentCheckResult,
  type AgentTestConversation,
  type AgentTestDefaults,
  type AgentTestRunWithDetails,
  type AgentTestSetup,
  type DetailRow,
  type DetailTone,
  type Exchange,
  type ExchangeLine,
  type StreamEventData,
  type TransportId,
} from '@/domain/agents';
import { TRANSPORTS } from './concierge';

const HOST = 'https://concierge.staging.acme.io';

export const CONVERSATION_CHECKS: AgentTestConversation[] = [
  {
    id: 'millefeuille-for-dessert', skillId: 'recommend-pastry', turns: '1 turn', expect: 'completed', prompt: '"Something light for dessert tonight?"',
    lifecycle: 'submitted → working → completed', contains: 'text contains "Millefeuille"', regex: 'text matches /mille-?feuille/i',
    artifact: 'recommendation · application/json · {name, price, reason} valid', ms: { jsonrpc: 1840, http: 1910, grpc: 1720 },
  },
  {
    id: 'eclair-size-m', skillId: 'order-pastry', turns: '2 turns', expect: 'completed', prompt: '"I would like to order an Eclair Cafe" → "M"',
    lifecycle: 'submitted → working → input-required → working → completed · same taskId t-1', contains: 'question contains "S, M or L"',
    regex: 'question matches /\\bS\\b.*\\bM\\b.*\\bL\\b/', artifact: 'order · application/json · {orderId, pastry, size, total} valid · uses GET /pastries/{name}',
    ms: { jsonrpc: 2960, http: 3120, grpc: 2840 },
  },
  {
    id: 'ord-2417-ready', skillId: 'track-order', turns: '1 turn · streamed', expect: 'completed', prompt: '"Where is my order ord-2417?"',
    lifecycle: 'submitted → working → completed · 2 chunks on artifact status, lastChunk on "ready"', contains: 'chunks contain "baking", "ready"',
    regex: 'chunks match /baking|ready/', artifact: 'status · text/plain · append, then lastChunk: true', ms: { jsonrpc: 2510, http: 2560, grpc: 2419 },
  },
  {
    id: 'unknown-order', skillId: 'track-order', turns: '1 turn', expect: 'failed', prompt: '"Where is my order ord-0000?"', lifecycle: 'submitted → working → failed',
    contains: 'agent message contains "No order ord-0000"', regex: 'agent message matches /no order ord-0000/i', artifact: 'none expected · none received',
    ms: { jsonrpc: 860, http: 910, grpc: 820 },
  },
  {
    id: 'out-of-scope', skillId: '(none)', turns: '1 turn', expect: 'rejected', prompt: '"Can you book me a table for two?"', lifecycle: 'rejected (terminal, no task work)',
    contains: 'agent message contains "pastries"', regex: 'agent message matches /pastr(y|ies)/i', artifact: 'none expected · none received', ms: { jsonrpc: 640, http: 700, grpc: 610 },
  },
];

const CARD_MS = { schema: 42, sig: 4, iface: { jsonrpc: 96, http: 88, grpc: 131 }, caps: { jsonrpc: 1420, http: 1380, grpc: 1510 } };

/** The agent under test: it resumes input-required on a new task over HTTP+JSON and drops lastChunk on the gRPC stream. */
function resultOf(row: string, transport: string): AgentCheckResult {
  if (row === 'sig') return 'warn';
  if (row === 'eclair-size-m' && transport === 'http') return 'fail';
  if (row === 'ord-2417-ready' && transport === 'grpc') return 'fail';
  return 'pass';
}

function msOf(row: string, transport: TransportId | '*'): number {
  if (row === 'schema') return CARD_MS.schema;
  if (row === 'sig') return CARD_MS.sig;
  if (transport === '*') return 0;
  if (row === 'iface' || row === 'caps') return CARD_MS[row][transport];
  return CONVERSATION_CHECKS.find((c) => c.id === row)?.ms[transport] ?? 0;
}

const fmtMs = (ms: number): string => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms} ms`);

export function agentTestDefaults(serviceId: string): AgentTestDefaults {
  return {
    setup: {
      serviceId,
      cardUrl: `${HOST}/.well-known/agent-card.json`,
      transports: ['jsonrpc', 'http', 'grpc'],
      conversations: CONVERSATION_CHECKS.map((c) => c.id),
      secret: 'concierge-staging-oauth',
      timeoutMs: 15000,
      textMode: 'contains',
      dataSchema: true,
    },
    transports: [
      { id: 'jsonrpc', label: 'JSON-RPC', sub: 'JSON-RPC 2.0 over HTTP · SSE streaming', url: `${HOST}/a2a/jsonrpc`, preferred: true },
      { id: 'http', label: 'HTTP+JSON', sub: 'REST binding · SSE streaming', url: `${HOST}/a2a/v1`, preferred: false },
      { id: 'grpc', label: 'gRPC', sub: 'a2a.v1.A2AService · server streaming', url: 'concierge.staging.acme.io:443', preferred: false },
    ],
    conversations: CONVERSATION_CHECKS,
    secrets: [
      {
        name: 'concierge-staging-oauth', matches: true,
        help: 'OAuth2 client credentials for scheme bakeryOAuth, declared in the card. Microcks fetches a token before each conversation.',
      },
      {
        name: 'pastry-staging-basic', matches: false,
        help: 'Basic auth does not match the card: it declares bakeryOAuth (OAuth2 client credentials). Calls will likely end in auth-required.',
      },
      { name: '', matches: false, help: 'The card declares securityRequirements bakeryOAuth. Without a secret the agent should answer auth-required.' },
    ],
  };
}

const row = (label: string, value: string, tone: DetailTone = 'plain'): DetailRow => ({ label, value, tone });
const L = (text: string, kind?: ExchangeLine['kind']): ExchangeLine => ({ text, kind });

const ECLAIR_HEADERS = [L('A2A-Version: 1.0', 'head'), L('Authorization: Bearer eyJhbGciOi…', 'head'), L('Content-Type: application/json', 'head')];

function eclairExchanges(): Exchange[] {
  return [
    {
      head: `POST ${HOST}/a2a/v1/message:send`, status: '200 OK · 1 284 ms', statusTone: 'ok', highlight: false,
      request: [
        ...ECLAIR_HEADERS, L('{'), L('  "message": {'), L('    "messageId": "m-01",'), L('    "role": "user",'), L('    "contextId": "ctx-8c1f",'),
        L('    "parts": [{ "text": "I would like to order an Eclair Cafe" }],'), L('    "metadata": { "skillId": "order-pastry" }'), L('  }'), L('}'),
      ],
      response: [
        L('{'), L('  "task": {'), L('    "id": "t-1",'), L('    "contextId": "ctx-8c1f",'), L('    "status": {'), L('      "state": "TASK_STATE_INPUT_REQUIRED",'),
        L('      "message": { "role": "agent",'), L('        "parts": [{ "text": "Which size: S, M or L?" }] }'), L('    }'), L('  }'), L('}'),
      ],
    },
    {
      head: `POST ${HOST}/a2a/v1/message:send`, status: '200 OK · 1 836 ms · task state wrong', statusTone: 'bad', highlight: true,
      request: [
        ...ECLAIR_HEADERS, L('{'), L('  "message": {'), L('    "messageId": "m-02",'), L('    "role": "user",'), L('    "contextId": "ctx-8c1f",'), L('    "taskId": "t-1",', 'ok'),
        L('    "parts": [{ "text": "M" }]'), L('  }'), L('}'),
      ],
      response: [
        L('{'), L('  "task": {'), L('    "id": "t-2",', 'bad'), L('    "contextId": "ctx-8c1f",'), L('    "status": { "state": "TASK_STATE_COMPLETED" },'),
        L('    "artifacts": [{ "artifactId": "a-1", "name": "order",'), L('      "parts": [{ "data": { "orderId": "ord-2417",'), L('        "pastry": "Eclair Cafe", "size": "M", "total": 2.5 } }] }]'),
        L('  }'), L('}'),
      ],
    },
    {
      head: `GET ${HOST}/a2a/v1/tasks/t-1`, status: '200 OK · 46 ms · follow-up check', statusTone: 'plain', highlight: false,
      request: ECLAIR_HEADERS.slice(0, 2),
      response: [L('{'), L('  "id": "t-1",'), L('  "contextId": "ctx-8c1f",'), L('  "status": { "state": "TASK_STATE_INPUT_REQUIRED" }', 'bad'), L('}')],
    },
  ];
}

function streamEvents(): StreamEventData[] {
  const ok = { text: 'ok', tone: 'ok' as const };
  return [
    { at: '+0 ms', kind: 'request', detail: 'message m-01 · "Where is my order ord-2417?"', flags: [] },
    { at: '+41 ms', kind: 'Task', detail: 'id t-7 · state submitted', flags: [ok] },
    { at: '+386 ms', kind: 'TaskStatusUpdateEvent', detail: 'state working', flags: [ok] },
    { at: '+1 204 ms', kind: 'TaskArtifactUpdateEvent', detail: 'artifact status · text "baking"', flags: [{ text: 'append: true', tone: 'plain' }, { text: 'lastChunk: false', tone: 'plain' }] },
    {
      at: '+2 377 ms', kind: 'TaskArtifactUpdateEvent', detail: 'artifact status · text "ready"', mark: 'x',
      flags: [{ text: 'append: true', tone: 'plain' }, { text: 'lastChunk: not set', tone: 'bad' }],
    },
    {
      at: 'expected', kind: 'TaskArtifactUpdateEvent', detail: 'artifact status · last chunk, before the terminal state', mark: '+', expected: true,
      flags: [{ text: 'lastChunk: true', tone: 'ok' }],
    },
    { at: '+2 418 ms', kind: 'TaskStatusUpdateEvent', detail: 'state completed', flags: [ok] },
    { at: '+2 419 ms', kind: 'stream closed', detail: 'gRPC status OK (0) · 6 messages received', flags: [] },
  ];
}

function detailOf(check: AgentCheck, setup: AgentTestSetup): AgentCheckDetail {
  const { row: id, transport } = check;
  const tr = transport === '*' ? undefined : TRANSPORTS.find((t) => t.id === transport);
  const trUrl = tr ? (tr.id === 'grpc' ? tr.publishedUrl : tr.publishedUrl) : '';
  const label = tr ? tr.name : '';
  if (id === 'schema') {
    return {
      kind: 'summary', title: 'Card schema', sub: `GET ${HOST}/.well-known/agent-card.json · 200 application/json`,
      rows: [
        row('Schema', 'A2A v1.0 AgentCard · 0 violations', 'ok'),
        row('Required', 'name, description, version, supportedInterfaces (3), capabilities, defaultInputModes, defaultOutputModes, skills (3)'),
        row('Security', 'securitySchemes.bakeryOAuth · oauth2 clientCredentials'),
        row('Modes', 'text/plain, application/json'),
        row('Duration', fmtMs(CARD_MS.schema)),
      ],
      note: 'The first entry of supportedInterfaces, JSONRPC, is the preferred one. Every skill declares at least one example prompt.',
    };
  }
  if (id === 'sig') {
    return {
      kind: 'summary', title: 'Card signature', sub: 'agent-card.json · signatures',
      rows: [row('signatures', 'absent', 'warn'), row('Impact', 'clients cannot verify that the card comes from Bakery platform'), row('Counted as', 'warning · does not fail the run')],
      note: 'Signatures are optional in A2A v1.0. When a card carries a JWS, Microcks verifies it against the published key and fails the check if it does not match.',
    };
  }
  if (id === 'iface' && tr) {
    const probe = tr.id === 'grpc' ? 'a2a.v1.A2AService/GetTask' : tr.id === 'http' ? 'GET /a2a/v1/tasks/probe-0' : 'POST /a2a/jsonrpc · method GetTask';
    return {
      kind: 'summary', title: `${label} × Interface reachable`, sub: trUrl,
      rows: [
        row('Probe', `${probe} on an unknown id`), row('Answer', 'TaskNotFoundError, as expected', 'ok'),
        row('Header', 'A2A-Version: 1.0 accepted · 0.9 answered VersionNotSupportedError'), row('Auth', 'Bearer token from concierge-staging-oauth accepted'),
        row('Duration', fmtMs(CARD_MS.iface[tr.id])),
      ],
      note: 'Reachability uses methods that create nothing on the agent, so the probe is safe to run against staging.',
    };
  }
  if (id === 'caps' && tr) {
    return {
      kind: 'summary', title: `${label} × Capabilities honoured`, sub: 'capabilities · streaming: true · pushNotifications: true · extendedAgentCard: false',
      rows: [
        row('streaming', `${tr.streaming} · 3 events, ordered`, 'ok'),
        row('pushNotifications', 'CreateTaskPushNotificationConfig accepted · webhook received 2 notifications with the expected token', 'ok'),
        row('extendedAgentCard', 'declared false · not probed', 'muted'), row('Duration', fmtMs(CARD_MS.caps[tr.id])),
      ],
      note: 'A capability declared true must work: Microcks registers its own webhook for push notifications and checks that each call carries the token.',
    };
  }
  if (id === 'eclair-size-m' && transport === 'http') {
    const node = (labelText: string, task: string, at: string, extra: { tone?: 'ok' | 'bad'; absent?: boolean } = {}) => ({ label: labelText, task, at, ...extra });
    return {
      kind: 'lanes', title: 'HTTP+JSON × eclair-size-m', sub: 'skill order-pastry · contextId ctx-8c1f · POST /a2a/v1/message:send',
      lanes: [
        {
          label: 'Expected', sub: 'task script', tone: 'ok',
          nodes: [
            node('submitted', 'task t-1', '+0 ms'), node('working', 'task t-1', '+210 ms'), node('input-required', 'task t-1 · "Which size?"', '+1.31 s'),
            node('user "M"', 'taskId t-1', 'turn 2'), node('working', 'task t-1 · resumed', 'any delay', { tone: 'ok' }),
            node('completed', 'task t-1 · artifact order', 'terminal', { tone: 'ok' }), { label: '—', absent: true },
          ],
        },
        {
          label: 'Actual', sub: 'HTTP+JSON', tone: 'bad',
          nodes: [
            node('submitted', 'task t-1', '+0 ms'), node('working', 'task t-1', '+204 ms'), node('input-required', 'task t-1 · "Which size?"', '+1.28 s'),
            node('user "M"', 'taskId t-1', '+1.34 s'), node('submitted', 'NEW task t-2', '+1.36 s', { tone: 'bad' }), node('working', 'task t-2', '+1.52 s', { tone: 'bad' }),
            node('completed', 'task t-2 · artifact order', '+3.12 s'),
          ],
        },
      ],
      exchanges: eclairExchanges(),
    };
  }
  if (id === 'ord-2417-ready' && transport === 'grpc') {
    return { kind: 'stream', title: 'gRPC × ord-2417-ready', sub: 'skill track-order · SendStreamingMessage, server streaming · concierge.staging.acme.io:443', events: streamEvents() };
  }
  const conversation = CONVERSATION_CHECKS.find((c) => c.id === id);
  if (conversation && tr) {
    const streamed = id === 'ord-2417-ready';
    const answered = tr.id === 'grpc' ? 'gRPC status OK' : '200 OK';
    return {
      kind: 'summary', title: `${label} × ${id}`, sub: `skill ${conversation.skillId} · ${streamed ? tr.streaming : `${tr.id === 'grpc' ? 'a2a.v1.A2AService/SendMessage' : tr.id === 'http' ? 'POST /a2a/v1/message:send' : 'POST /a2a/jsonrpc · method SendMessage'}`}`,
      rows: [
        row('Sent', conversation.prompt), row('Task states', conversation.lifecycle, 'ok'),
        row('Text check', `${setup.textMode === 'regex' ? conversation.regex : conversation.contains} · matched`, 'ok'),
        row('Artifacts', conversation.artifact + (setup.dataSchema && conversation.artifact.includes('json') ? ' (JSON Schema)' : '')),
        row('Transport', `${answered} · a2a.proto shape valid`), row('Duration', fmtMs(conversation.ms[tr.id])),
      ],
      note:
        conversation.expect === 'completed'
          ? 'Every transition was legal and the task ended in the expected terminal state. Agent text varies between runs, so only the loose match above is asserted.'
          : `The expected outcome is a terminal ${conversation.expect} task, not a transport error: the agent answered ${answered} with a task in the ${conversation.expect} state, which is what the conversation asks for.`,
    };
  }
  return { kind: 'summary', title: id, sub: '', rows: [], note: '' };
}

/** Executes the plan of a setup against the simulated agent and records every cell with its detail. */
export function executeAgentTest(id: string, setup: AgentTestSetup): AgentTestRunWithDetails {
  const checks: AgentCheck[] = planChecks(setup).map((p) => ({ ...p, result: resultOf(p.row, p.transport), ms: msOf(p.row, p.transport) }));
  const details: Record<string, AgentCheckDetail> = {};
  for (const check of checks) details[cellKey(check.row, check.transport)] = detailOf(check, setup);
  const failures = checks
    .filter((c) => c.result === 'fail' && c.transport !== '*')
    .map((c) => ({
      row: c.row,
      transport: c.transport as TransportId,
      cause: c.row === 'eclair-size-m' ? 'new taskId after input-required' : 'stream closed without lastChunk: true',
    }));
  return { id, setup, checks, details, failures };
}
