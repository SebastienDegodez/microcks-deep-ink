import type { AgentCard, AgentProfile, AgentSkill, AgentTransport, Conversation, ScriptPart } from '../../../../domain/agents/index.js';
import { MICROCKS_BASE } from '../../shared/index.js';

const text = (value: string): ScriptPart => ({ kind: 'text', text: value });
const data = (value: unknown): ScriptPart => ({ kind: 'data', body: JSON.stringify(value, null, 2) });

const A2A = `${MICROCKS_BASE}/a2a/Pastry+concierge/1.0`;
const HOST = 'https://concierge.staging.acme.io';

export const CONCIERGE_ID = 'concierge';

export const TRANSPORTS: AgentTransport[] = [
  {
    id: 'jsonrpc', name: 'JSON-RPC 2.0', binding: 'JSONRPC', preferred: true, mockUrl: `${A2A}/jsonrpc`, publishedUrl: `${HOST}/a2a/jsonrpc`, urlLabel: 'Endpoint',
    streaming: 'SendStreamingMessage over SSE',
    more: 'GetTask · ListTasks · CancelTask · SubscribeToTask · CreateTaskPushNotificationConfig (+ Get, List, Delete)',
  },
  {
    id: 'http', name: 'HTTP+JSON', binding: 'HTTP+JSON', preferred: false, mockUrl: `${A2A}/v1`, publishedUrl: `${HOST}/a2a/v1`, urlLabel: 'Base URL',
    streaming: 'POST /message:stream over SSE',
    more: 'GET /tasks/{id} · GET /tasks · POST /tasks/{id}:cancel · GET /tasks/{id}:subscribe · POST /tasks/{id}/pushNotificationConfigs',
  },
  {
    id: 'grpc', name: 'gRPC', binding: 'GRPC', preferred: false, mockUrl: 'microcks.local:9090', publishedUrl: 'concierge.staging.acme.io:443',
    urlLabel: 'Host · service a2a.v1.A2AService', streaming: 'SendStreamingMessage, server streaming',
    more: 'GetTask · ListTasks · CancelTask · SubscribeToTask · CreateTaskPushNotificationConfig · reflection enabled',
  },
];

export const SKILLS: AgentSkill[] = [
  {
    id: 'recommend-pastry', name: 'Recommend a pastry', calls: 29, tags: ['menu'], inputModes: ['text/plain'], outputModes: ['application/json', 'text/plain'],
    description: "Suggests one pastry from today's menu for an occasion, a taste or a budget, with a one-line reason.",
    examples: ['What should I take for dessert tonight?', 'Something with coffee for under 3 euros', 'A light pastry to share between four'],
    conversationIds: ['millefeuille-for-dessert'],
    lastTest: { result: 'pass', title: 'Run #3: passed on JSON-RPC, HTTP+JSON and gRPC' },
  },
  {
    id: 'order-pastry', name: 'Order a pastry', calls: 14, tags: ['orders', 'multi-turn'], inputModes: ['text/plain', 'application/json'], outputModes: ['application/json'],
    description: 'Places an order for one pastry. When the message gives no size, the agent asks for it and waits (input-required), then confirms the order and its total.',
    examples: ["I'd like to order an Eclair Cafe", 'Two Millefeuille, size L', 'Order the chocolate eclair'],
    conversationIds: ['eclair-size-m'], usesService: 'pastry2',
    lastTest: { result: 'fail', title: 'Run #3: HTTP+JSON resumed input-required on a new taskId' },
  },
  {
    id: 'track-order', name: 'Track an order', calls: 18, tags: ['orders', 'streaming'], inputModes: ['text/plain', 'application/json'], outputModes: ['text/plain'],
    description: 'Follows an order from the oven to the counter and streams its status until it is ready.',
    examples: ['Where is my order ord-2417?', 'Is ord-2417 ready yet?'],
    conversationIds: ['ord-2417-ready', 'unknown-order'],
    lastTest: { result: 'fail', title: 'Run #3: gRPC stream closed without lastChunk: true' },
  },
];

const CONVERSATIONS: Conversation[] = [
  {
    id: 'millefeuille-for-dessert', skillId: 'recommend-pastry', contextId: 'ctx-2b70', taskId: 'task-41b8', method: 'SendMessage', length: '850 ms', turns: 1, streamed: false,
    match: 'metadata.skillId = recommend-pastry',
    steps: [
      { kind: 'user', at: '0 ms', messageId: 'msg-u1', meta: 'metadata.skillId = recommend-pastry', parts: [text('What should I take for dessert tonight? Something rich.')] },
      { kind: 'state', state: 'submitted', at: '+0 ms' },
      { kind: 'state', state: 'working', at: '+300 ms', message: "Looking at today's menu…" },
      {
        kind: 'artifact', at: '+800 ms', name: 'recommendation', artifactId: 'art-reco-1',
        parts: [
          data({ name: 'Millefeuille', price: 4.4, reason: "Pastry cream between three layers of puff pastry: the richest dessert on today's menu." }),
          text('I recommend the Millefeuille, 4.40.'),
        ],
      },
      { kind: 'state', state: 'completed', at: '+850 ms' },
    ],
  },
  {
    id: 'eclair-size-m', skillId: 'order-pastry', contextId: 'ctx-8c1f', taskId: 'task-5e27', method: 'SendMessage', length: '2 turns · 2.0 s', turns: 2, streamed: false,
    match: 'first text part ≈ "order an Eclair Cafe"',
    steps: [
      { kind: 'user', at: '0 ms', messageId: 'msg-u1', meta: 'new task', parts: [text("I'd like to order an Eclair Cafe")] },
      { kind: 'state', state: 'submitted', at: '+0 ms' },
      { kind: 'state', state: 'working', at: '+400 ms', message: 'Checking that Eclair Cafe is available.' },
      { kind: 'call', at: '+450 ms', text: 'GET /pastries/Eclair Cafe' },
      { kind: 'state', state: 'input-required', at: '+900 ms', message: 'Which size: S, M or L?' },
      { kind: 'turn', at: 'turn 2', title: 'Turn 2', text: 'The next message must carry taskId task-5e27 and contextId ctx-8c1f: the same task resumes.' },
      { kind: 'user', at: 'reply', messageId: 'msg-u2', meta: 'taskId task-5e27 · contextId ctx-8c1f', parts: [text('M')] },
      { kind: 'state', state: 'working', at: '+200 ms', message: 'Placing the order.' },
      { kind: 'artifact', at: '+700 ms', name: 'order', artifactId: 'art-order-1', parts: [data({ orderId: 'ord-2417', pastry: 'Eclair Cafe', size: 'M', total: 2.5 })] },
      { kind: 'state', state: 'completed', at: '+750 ms' },
    ],
  },
  {
    id: 'ord-2417-ready', skillId: 'track-order', contextId: 'ctx-77d2', taskId: 'task-9a04', method: 'SendStreamingMessage', length: '3.05 s · streamed', turns: 1, streamed: true,
    match: 'data part orderId = ord-2417',
    steps: [
      { kind: 'user', at: '0 ms', messageId: 'msg-u1', meta: 'metadata.skillId = track-order', parts: [text('Where is my order?'), data({ orderId: 'ord-2417' })] },
      { kind: 'state', state: 'submitted', at: '+0 ms', event: 'Task' },
      { kind: 'state', state: 'working', at: '+200 ms', event: 'TaskStatusUpdateEvent', message: 'Asking the oven.' },
      {
        kind: 'chunks', at: '+1.2 s', name: 'status', artifactId: 'art-status',
        chunks: [
          { n: 1, at: '+1.2 s', text: 'baking', append: false, last: false },
          { n: 2, at: '+3.0 s', text: 'ready', append: true, last: true },
        ],
      },
      { kind: 'state', state: 'completed', at: '+3.05 s', event: 'TaskStatusUpdateEvent · final' },
    ],
  },
  {
    id: 'unknown-order', skillId: 'track-order', contextId: 'ctx-90ab', taskId: 'task-2f6d', method: 'SendStreamingMessage', length: '600 ms · streamed', turns: 1, streamed: true,
    match: 'data part orderId = ord-0000',
    steps: [
      { kind: 'user', at: '0 ms', messageId: 'msg-u1', meta: 'metadata.skillId = track-order', parts: [text('Where is order ord-0000?'), data({ orderId: 'ord-0000' })] },
      { kind: 'state', state: 'submitted', at: '+0 ms', event: 'Task' },
      { kind: 'state', state: 'working', at: '+200 ms', event: 'TaskStatusUpdateEvent', message: 'Looking for the order.' },
      { kind: 'state', state: 'failed', at: '+600 ms', event: 'TaskStatusUpdateEvent · final', message: 'No order ord-0000' },
    ],
  },
];

const FALLBACK: Conversation = {
  id: 'out-of-scope', skillId: '', contextId: 'ctx-c3f0', taskId: 'task-c3f0', method: 'SendMessage', length: '50 ms', turns: 1, streamed: false,
  match: 'no skillId, no conversation close enough',
  steps: [
    { kind: 'user', at: '0 ms', messageId: 'msg-u1', meta: 'no metadata.skillId', parts: [text('Can you book me a table for two at 8 pm?')] },
    { kind: 'state', state: 'submitted', at: '+0 ms' },
    { kind: 'state', state: 'rejected', at: '+50 ms', message: 'I can only recommend, order and track pastries. Try: "Recommend a pastry for dessert".' },
  ],
};

const CARD: AgentCard = {
  name: 'Pastry concierge',
  description: 'Recommends pastries, takes orders and tracks them until they are ready.',
  version: '1.0',
  provider: { organization: 'Bakery platform', url: 'https://bakery.acme.io' },
  supportedInterfaces: TRANSPORTS.map((t) => ({ url: t.publishedUrl, protocolBinding: t.binding, protocolVersion: '1.0' })),
  capabilities: { streaming: true, pushNotifications: true, extensions: [], extendedAgentCard: false },
  securitySchemes: {
    bakeryOAuth: {
      oauth2SecurityScheme: {
        description: 'OAuth2 client credentials',
        flows: { clientCredentials: { tokenUrl: 'https://auth.acme.io/oauth2/token', scopes: { 'pastry:read': 'Read the menu', 'orders:write': 'Place and track orders' } } },
      },
    },
  },
  securityRequirements: [{ bakeryOAuth: ['pastry:read', 'orders:write'] }],
  defaultInputModes: ['text/plain', 'application/json'],
  defaultOutputModes: ['text/plain', 'application/json'],
  skills: SKILLS.map((k) => ({
    id: k.id, name: k.name, description: k.description, tags: k.tags, examples: k.examples, inputModes: k.inputModes, outputModes: k.outputModes,
  })),
};

/** Pastry concierge 1.0, the A2A agent of the Agent prototype (screen 18). */
export function conciergeProfile(): AgentProfile {
  return {
    serviceId: CONCIERGE_ID,
    name: 'Pastry concierge',
    version: '1.0',
    description:
      'A conversational agent from the Bakery platform: it recommends pastries, takes orders and tracks them until they are ready. Its Agent Card is the contract; each skill is served as an operation and each conversation as a scripted task.',
    provider: 'Bakery platform',
    specVersion: '1.0',
    importedAt: '2026-11-03T08:41:04Z',
    importedFrom: `${HOST}/.well-known/agent-card.json`,
    labels: ['domain=pastry', 'status=beta', 'provider=Bakery platform'],
    card: CARD,
    skills: SKILLS,
    conversations: CONVERSATIONS,
    fallback: FALLBACK,
    fallbackCalls: 3,
    transports: TRANSPORTS,
    mockCardUrl: `${A2A}/.well-known/agent-card.json`,
    publishedCardUrl: `${HOST}/.well-known/agent-card.json`,
    webhook: { url: 'https://hooks.dev.acme.io/a2a/concierge', lastDelivery: '204 · 41 ms' },
    lastTest: { runId: '3', result: 'failed' },
  };
}
