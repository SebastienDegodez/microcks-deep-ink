import type { AgentTask, TaskArtifact, TaskMessage } from '@/domain/agents';
import { isTerminalTaskState } from '@/domain/agents';

const H = (role: TaskMessage['role'], text: string): TaskMessage => ({ role, text });
const art = (name: string, id: string, body: string, note?: string): TaskArtifact => ({ name, id, body, note });
const js = (value: unknown): string => JSON.stringify(value, null, 2);

/** Demo clock at tick 0 (a few seconds after the demo clock of the other screens, so the stream feels live). */
const BASE_MS = Date.UTC(2026, 10, 3, 9, 10, 4);

export interface TaskClock {
  /** Seconds since the page started watching the mock. */
  tick: number;
  /** Tick at which the person canceled a task. */
  canceled: Readonly<Record<string, number>>;
}

/**
 * Tasks of the mock at a given tick. `task-9a04` is streamed by the script (baking at 2 s, ready at 5 s);
 * `task-d3a1` is a new call that arrives at 8 s and completes at 9 s. The others are history.
 */
export function tasksAt({ tick, canceled }: TaskClock): AgentTask[] {
  const liveCanceled = canceled['task-9a04'] !== undefined;
  const lt = Math.min(tick, liveCanceled ? (canceled['task-9a04'] ?? tick) : Number.POSITIVE_INFINITY);
  let liveState: AgentTask['state'] = 'working';
  const liveHistory = [H('user', 'Where is my order? · data { orderId: "ord-2417" }'), H('agent', 'Asking the oven.')];
  const liveArts: TaskArtifact[] = [];
  if (lt >= 2) liveArts.push(art('status', 'art-status', '[ { "text": "baking" } ]', 'chunk 1 · append false'));
  if (lt >= 5) {
    liveArts[0] = art('status', 'art-status', '[\n  { "text": "baking" },\n  { "text": "ready" }\n]', 'lastChunk true');
    liveState = 'completed';
  }
  if (liveCanceled && liveState !== 'completed') liveState = 'canceled';
  const liveUpdated = liveState === 'completed' ? tick - 5 : liveCanceled ? tick - (canceled['task-9a04'] ?? tick) : 0;
  if (liveCanceled && liveState === 'canceled') liveHistory.push(H('system', 'CancelTask by MA from this page'));

  const tasks: AgentTask[] = [];
  if (tick >= 8) {
    const done = tick >= 9;
    tasks.push({
      id: 'task-d3a1', contextId: 'ctx-d3a1', skillId: 'recommend-pastry', state: done ? 'completed' : 'submitted', transport: 'gRPC', method: 'SendMessage',
      client: 'concierge-e2e', updatedSecondsAgo: done ? tick - 9 : 0, live: !done, updatedAt: '',
      history: [H('user', 'Something with coffee for under 3 euros'), ...(done ? [H('agent', 'I recommend the Eclair Cafe, 2.50.')] : [])],
      artifacts: done ? [art('recommendation', 'art-reco-7', js({ name: 'Eclair Cafe', price: 2.5, reason: 'Coffee cream, and under 3 euros.' }))] : [],
    });
  }
  tasks.push({
    id: 'task-9a04', contextId: 'ctx-77d2', skillId: 'track-order', state: liveState, transport: 'JSON-RPC', method: 'SendStreamingMessage', client: 'order-service · dev',
    updatedSecondsAgo: liveUpdated, live: liveState === 'working', history: liveHistory, artifacts: liveArts, push: true, updatedAt: '',
  });
  tasks.push(
    {
      id: 'task-5e27', contextId: 'ctx-8c1f', skillId: 'order-pastry', state: 'input-required', transport: 'HTTP+JSON', method: 'SendMessage', client: 'checkout-agent',
      updatedSecondsAgo: 18 + tick, live: false, updatedAt: '', history: [H('user', "I'd like to order an Eclair Cafe"), H('agent', 'Which size: S, M or L?')], artifacts: [],
    },
    {
      id: 'task-41b8', contextId: 'ctx-2b70', skillId: 'recommend-pastry', state: 'completed', transport: 'gRPC', method: 'SendMessage', client: 'concierge-e2e',
      updatedSecondsAgo: 64 + tick, live: false, updatedAt: '',
      history: [H('user', 'What should I take for dessert tonight? Something rich.'), H('agent', 'I recommend the Millefeuille, 4.40.')],
      artifacts: [art('recommendation', 'art-reco-1', js({ name: 'Millefeuille', price: 4.4, reason: "Pastry cream between three layers of puff pastry: the richest dessert on today's menu." }))],
    },
    {
      id: 'task-c3f0', contextId: 'ctx-c3f0', skillId: '', state: 'rejected', transport: 'JSON-RPC', method: 'SendMessage', client: 'postman', updatedSecondsAgo: 236 + tick, live: false, updatedAt: '',
      history: [H('user', 'Can you book me a table for two at 8 pm?'), H('agent', 'I can only recommend, order and track pastries. Try: "Recommend a pastry for dessert".')], artifacts: [],
    },
    {
      id: 'task-2f6d', contextId: 'ctx-90ab', skillId: 'track-order', state: 'failed', transport: 'HTTP+JSON', method: 'SendStreamingMessage', client: 'order-service · dev',
      updatedSecondsAgo: 371 + tick, live: false, updatedAt: '',
      history: [H('user', 'Where is order ord-0000? · data { orderId: "ord-0000" }'), H('agent', 'No order ord-0000')], artifacts: [],
    },
    {
      id: 'task-7e11', contextId: 'ctx-5d14', skillId: 'order-pastry', state: 'canceled', transport: 'JSON-RPC', method: 'SendMessage', client: 'checkout-agent',
      updatedSecondsAgo: 702 + tick, live: false, updatedAt: '',
      history: [H('user', 'Order a Millefeuille'), H('agent', 'Which size: S, M or L?'), H('system', 'CancelTask by checkout-agent')], artifacts: [],
    },
    {
      id: 'task-0b93', contextId: 'ctx-1e07', skillId: 'recommend-pastry', state: 'completed', transport: 'JSON-RPC', method: 'SendMessage', client: 'concierge-e2e',
      updatedSecondsAgo: 915 + tick, live: false, updatedAt: '',
      history: [H('user', 'A light pastry to share between four'), H('agent', 'I recommend four Eclair Chocolat, 2.40 each.')],
      artifacts: [art('recommendation', 'art-reco-3', js({ name: 'Eclair Chocolat', price: 2.4, reason: 'Light, easy to share, and four fit in one box.' }))],
    },
  );
  // Cancellations of tasks that were still open.
  const result = tasks.map((task) => {
    const at = canceled[task.id];
    if (task.id === 'task-9a04' || at === undefined || isTerminalTaskState(task.state)) return task;
    return { ...task, state: 'canceled' as const, updatedSecondsAgo: tick - at, live: false, history: [...task.history, H('system', 'CancelTask by MA from this page')] };
  });
  return result.map((task) => ({ ...task, updatedAt: new Date(BASE_MS + (tick - task.updatedSecondsAgo) * 1000).toISOString().replace('.000', '') }));
}
