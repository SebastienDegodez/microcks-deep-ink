import { taskStateWire, type AgentTransport, type TransportId } from './types.js';

export type CallMode = 'unary' | 'stream';

const js = (value: unknown): string => JSON.stringify(value, null, 2);
const indent = (text: string): string => text.split('\n').join('\n  ');

const MESSAGE_RECOMMEND = {
  messageId: 'msg-001',
  role: 'user',
  parts: [{ text: 'What should I take for dessert tonight?' }],
  metadata: { skillId: 'recommend-pastry' },
};
const MESSAGE_TRACK = {
  messageId: 'msg-002',
  role: 'user',
  parts: [{ text: 'Where is my order?' }, { data: { orderId: 'ord-2417' }, mediaType: 'application/json' }],
  metadata: { skillId: 'track-order' },
};

/** Sample request of a transport, ready to paste in a terminal: curl for the two HTTP bindings, grpcurl for gRPC. */
export function transportSample(transport: AgentTransport, mode: CallMode): string {
  const stream = mode === 'stream';
  const message = stream ? MESSAGE_TRACK : MESSAGE_RECOMMEND;
  const accept = stream ? "  -H 'Accept: text/event-stream' \\\n" : '';
  const flag = stream ? '-N ' : '';
  if (transport.id === 'jsonrpc') {
    const body = js({ jsonrpc: '2.0', id: 1, method: stream ? 'SendStreamingMessage' : 'SendMessage', params: { message } });
    return `curl ${flag}-X POST '${transport.mockUrl}' \\\n  -H 'Content-Type: application/json' \\\n${accept}  -H 'A2A-Version: 1.0' \\\n  -d '${indent(body)}'`;
  }
  if (transport.id === 'http') {
    const path = stream ? '/message:stream' : '/message:send';
    return `curl ${flag}-X POST '${transport.mockUrl}${path}' \\\n  -H 'Content-Type: application/json' \\\n${accept}  -H 'A2A-Version: 1.0' \\\n  -d '${indent(js({ message }))}'`;
  }
  return `grpcurl -plaintext \\\n  -H 'a2a-version: 1.0' \\\n  -d '${indent(js({ message }))}' \\\n  ${transport.mockUrl} a2a.v1.A2AService/${stream ? 'SendStreamingMessage' : 'SendMessage'}`;
}

export function transportStreamingNote(transport: AgentTransport, mode: CallMode): string {
  if (mode === 'unary') return `Streaming: ${transportStreamingKind(transport.id, false)}`;
  return transportStreamingKind(transport.id, true);
}

function transportStreamingKind(id: TransportId, stream: boolean): string {
  if (id === 'jsonrpc') return stream ? 'SendStreamingMessage answers text/event-stream (SSE)' : 'SendStreamingMessage over SSE';
  if (id === 'http') return stream ? 'POST /message:stream answers text/event-stream (SSE)' : 'POST /message:stream over SSE';
  return stream ? 'SendStreamingMessage is a server stream of StreamResponse' : 'SendStreamingMessage, server streaming';
}

const event = (value: unknown): string => `data: ${JSON.stringify(value)}`;

/** HTTP+JSON stream of the `ord-2417-ready` conversation, paced by the task script. States use the v1.0 wire names. */
export const SSE_SAMPLE = [
  ': +0 ms',
  event({ task: { id: 'task-9a04', contextId: 'ctx-77d2', status: { state: taskStateWire('submitted') } } }),
  '',
  ': +200 ms',
  event({ statusUpdate: { taskId: 'task-9a04', contextId: 'ctx-77d2', status: { state: taskStateWire('working') } } }),
  '',
  ': +1.2 s',
  event({ artifactUpdate: { taskId: 'task-9a04', artifact: { artifactId: 'art-status', name: 'status', parts: [{ text: 'baking' }] }, append: false, lastChunk: false } }),
  '',
  ': +3.0 s',
  event({ artifactUpdate: { taskId: 'task-9a04', artifact: { artifactId: 'art-status', name: 'status', parts: [{ text: 'ready' }] }, append: true, lastChunk: true } }),
  '',
  ': +3.05 s',
  event({ statusUpdate: { taskId: 'task-9a04', contextId: 'ctx-77d2', status: { state: taskStateWire('completed') }, final: true } }),
].join('\n');

export function pushSample(jsonRpcUrl: string): string {
  const body = js({
    jsonrpc: '2.0',
    id: 3,
    method: 'CreateTaskPushNotificationConfig',
    params: { taskId: 'task-9a04', config: { url: 'https://hooks.dev.acme.io/a2a/concierge', token: 'dev-7f3a', authentication: { schemes: ['Bearer'] } } },
  });
  return `curl -X POST '${jsonRpcUrl}' \\\n  -H 'Content-Type: application/json' \\\n  -H 'A2A-Version: 1.0' \\\n  -d '${indent(body)}'`;
}

/** `GetTask` answer of a task, as the spec shapes it. */
export function getTaskJson(task: {
  id: string;
  contextId: string;
  state: string;
  timestamp: string;
  history: { role: string; text: string }[];
  artifacts: { id: string; name: string; body: string }[];
}): string {
  return js({
    jsonrpc: '2.0',
    id: 7,
    result: {
      id: task.id,
      contextId: task.contextId,
      status: { state: taskStateWire(task.state as never), timestamp: task.timestamp },
      history: task.history.filter((h) => h.role !== 'system').map((h, i) => ({ messageId: `msg-${i + 1}`, role: h.role, parts: [{ text: h.text }] })),
      artifacts: task.artifacts.map((a) => ({
        artifactId: a.id,
        name: a.name,
        parts: a.name === 'status' ? (JSON.parse(a.body) as unknown) : [{ data: JSON.parse(a.body) as unknown }],
      })),
    },
  });
}
