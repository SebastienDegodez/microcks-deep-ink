// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cellKey, type AgentCheck } from '@/domain/agents';
import { BackendError, NotFoundError, ValidationError } from '@/application/shared';
import type { MicrocksService } from '@/infrastructure/http/catalog/dto';
import { createHttpClient, type HttpClient } from '@/infrastructure/http/client';
import { createInMemoryAgentAdapters } from '@/infrastructure/in-memory/agents';
import { FixedClock } from '@/infrastructure/in-memory/shared';
import { CONTRACT_API_BASE_URL } from '@/infrastructure/msw/http.contract';
import { server } from '@/infrastructure/msw/node';
import type { A2aTask } from './dto';
import {
  fromA2aTask,
  fromA2aTestRequest,
  fromTaskStateWire,
  partText,
  toA2aConformance,
  toA2aTask,
  toA2aTestRequest,
  toAgentProfile,
  toAgentTestDefaults,
  toAgentTestRun,
  toDemoAgentProfile,
  toMicrocksA2aTestResult,
} from './mapping';
import { createHttpAgentsAdapters } from '.';

const roundTrip = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const seeded = () => createInMemoryAgentAdapters({ clock: new FixedClock() });
const NOW = new Date('2026-11-03T09:10:04Z');

/** `GET /api/services/concierge` of a Microcks that knows the agent as a service (no demo extension). */
const CONCIERGE_SERVICE: MicrocksService = {
  id: 'concierge', name: 'Pastry concierge', version: '1.0', type: 'A2A', sourceArtifact: 'agent-card.json',
  metadata: { createdOn: Date.parse('2026-11-03T08:41:04Z'), lastUpdate: Date.parse('2026-11-03T08:41:04Z'), labels: { domain: 'pastry' } },
};

describe('A2A tasks', () => {
  it('reads a plain A2A 1.0 Task (no Microcks metadata) with defaults', () => {
    const task: A2aTask = {
      id: 'task-1', contextId: 'ctx-1',
      status: { state: 'TASK_STATE_WORKING', timestamp: '2026-11-03T09:09:54Z' },
      history: [
        { messageId: 'm1', role: 'ROLE_USER', parts: [{ text: 'Where is my order?' }, { data: { orderId: 'ord-1' } }] },
        { messageId: 'm2', role: 'ROLE_AGENT', parts: [{ text: 'Asking the oven.' }] },
      ],
      artifacts: [{ artifactId: 'art-1', name: 'recommendation', parts: [{ data: { name: 'Eclair', price: 2.5 } }] }],
    };
    expect(fromA2aTask(task, NOW)).toEqual({
      id: 'task-1', contextId: 'ctx-1', skillId: '', state: 'working', transport: 'JSON-RPC', method: 'SendMessage', client: '',
      updatedSecondsAgo: 10, live: true, updatedAt: '2026-11-03T09:09:54Z',
      history: [{ role: 'user', text: 'Where is my order? · {"orderId":"ord-1"}' }, { role: 'agent', text: 'Asking the oven.' }],
      artifacts: [{ name: 'recommendation', id: 'art-1', body: '{\n  "name": "Eclair",\n  "price": 2.5\n}' }],
    });
  });

  it('keeps A2A 1.0 file parts (url and raw) in history and artifacts, without demo metadata', () => {
    const task: A2aTask = {
      id: 'task-f', contextId: 'ctx-f', status: { state: 'TASK_STATE_COMPLETED', timestamp: '2026-11-03T09:10:04Z' },
      history: [
        { messageId: 'm1', role: 'ROLE_USER', parts: [{ text: 'Here is my receipt' }, { raw: 'aGVsbG8gd29ybGQ=', filename: 'receipt.txt', mediaType: 'text/plain' }] },
        { messageId: 'm2', role: 'ROLE_AGENT', parts: [{ url: 'https://agent.example/report.pdf', filename: 'report.pdf', mediaType: 'application/pdf' }] },
      ],
      artifacts: [
        { artifactId: 'art-url', name: 'report', parts: [{ url: 'https://agent.example/report.pdf', filename: 'report.pdf', mediaType: 'application/pdf' }] },
        { artifactId: 'art-raw', name: 'receipt', parts: [{ raw: 'aGVsbG8gd29ybGQ=', filename: 'receipt.txt', mediaType: 'text/plain' }] },
      ],
    };
    const mapped = fromA2aTask(task, NOW);
    expect(mapped.history).toEqual([
      { role: 'user', text: 'Here is my receipt · [file receipt.txt · text/plain · 11 bytes inline]' },
      { role: 'agent', text: '[file report.pdf · application/pdf · https://agent.example/report.pdf]' },
    ]);
    expect(JSON.parse(mapped.artifacts[0]!.body)).toEqual([{ url: 'https://agent.example/report.pdf', filename: 'report.pdf', mediaType: 'application/pdf' }]);
    expect(JSON.parse(mapped.artifacts[1]!.body)).toEqual([{ raw: 'aGVsbG8gd29ybGQ=', filename: 'receipt.txt', mediaType: 'text/plain' }]);
    // Written back, the artifact keeps its file parts.
    expect(toA2aTask(mapped).artifacts?.[0]?.parts).toEqual(task.artifacts?.[0]?.parts);
  });

  it('normalises A2A 0.x file parts and marks parts it cannot read instead of dropping them', () => {
    expect(partText({ kind: 'file', file: { name: 'menu.png', mimeType: 'image/png', uri: 'https://agent.example/menu.png' } })).toBe('[file menu.png · image/png · https://agent.example/menu.png]');
    expect(partText({ kind: 'file', file: { name: 'a.bin', bytes: 'AAEC' } })).toBe('[file a.bin · 3 bytes inline]');
    expect(partText({ mediaType: 'text/plain' })).toBe('[unsupported part {"mediaType":"text/plain"}]');
    const legacy = fromA2aTask({ id: 't', artifacts: [{ artifactId: 'a', parts: [{ kind: 'file', file: { name: 'menu.png', mimeType: 'image/png', uri: 'https://agent.example/menu.png' } }] }] }, NOW);
    expect(JSON.parse(legacy.artifacts[0]!.body)).toEqual([{ url: 'https://agent.example/menu.png', filename: 'menu.png', mediaType: 'image/png' }]);
  });

  it('reads the A2A 0.x state names and a bare task', () => {
    expect(fromTaskStateWire('input-required')).toBe('input-required');
    expect(fromTaskStateWire('TASK_STATE_AUTH_REQUIRED')).toBe('auth-required');
    expect(fromTaskStateWire('cancelled')).toBe('canceled');
    expect(fromTaskStateWire('TASK_STATE_UNSPECIFIED')).toBe('submitted');
    expect(fromA2aTask({ id: 't' }, NOW)).toMatchObject({ id: 't', state: 'submitted', history: [], artifacts: [], updatedAt: '', updatedSecondsAgo: 0 });
  });

  it('serialises the seeded tasks as A2A 1.0 Tasks and reads them back unchanged', async () => {
    const tasks = await seeded().tasks.list('concierge');
    const wire = roundTrip(tasks.map(toA2aTask));
    expect(wire[0]).toMatchObject({ id: 'task-9a04', status: { state: 'TASK_STATE_WORKING' }, metadata: { microcks: { protocolBinding: 'JSONRPC', live: true } } });
    expect(wire.map((t) => fromA2aTask(t, NOW))).toEqual(tasks);
  });
});

describe('agent profile', () => {
  it('builds the agent from a Microcks service alone', () => {
    expect(toAgentProfile(CONCIERGE_SERVICE)).toMatchObject({
      serviceId: 'concierge', name: 'Pastry concierge', version: '1.0', importedAt: '2026-11-03T08:41:04Z', labels: ['domain=pastry'],
      skills: [], transports: [], conversations: [], card: { name: 'Pastry concierge', version: '1.0', skills: [] },
    });
  });

  it('derives transports and skills from the card when the demo profile only has the card', async () => {
    const { card } = (await seeded().agents.get('concierge'))!;
    const profile = toAgentProfile(CONCIERGE_SERVICE, { card: roundTrip(card) });
    expect(profile.transports.map((t) => [t.id, t.binding, t.preferred])).toEqual([['jsonrpc', 'JSONRPC', true], ['http', 'HTTP+JSON', false], ['grpc', 'GRPC', false]]);
    expect(profile.skills.map((s) => s.id)).toEqual(['recommend-pastry', 'order-pastry', 'track-order']);
    expect(Object.keys(profile.card)).toEqual(Object.keys(card));
  });

  it('reads back the demo profile unchanged', async () => {
    const agent = (await seeded().agents.get('concierge'))!;
    expect(toAgentProfile(CONCIERGE_SERVICE, roundTrip(toDemoAgentProfile(agent)))).toEqual(agent);
  });
});

describe('agent tests', () => {
  it('builds the test form from the agent when there is no demo payload', async () => {
    const agent = (await seeded().agents.get('concierge'))!;
    const defaults = toAgentTestDefaults(agent);
    expect(defaults.setup).toMatchObject({ serviceId: 'concierge', transports: ['jsonrpc', 'http', 'grpc'], cardUrl: agent.publishedCardUrl, secret: '' });
    expect(defaults.conversations).toHaveLength(4);
    expect(defaults.nextRunId).toBeUndefined();
  });

  it('sends the setup as a Microcks TestRequest and reads it back', async () => {
    const { setup } = (await seeded().tests.defaults('concierge'))!;
    const request = roundTrip(toA2aTestRequest(setup));
    expect(request).toMatchObject({ serviceId: 'concierge', testEndpoint: setup.cardUrl, runnerType: 'A2A_CONFORMANCE', timeout: 15000, secretName: 'concierge-staging-oauth' });
    expect(fromA2aTestRequest(request, setup)).toEqual(setup);
    const { a2a, ...plain } = request;
    void a2a;
    expect(fromA2aTestRequest({ ...plain, secretName: undefined }, setup)).toEqual({ ...setup, secret: '' });
  });

  it('serialises run #3 as a Microcks TestResult: one test case per row, one step per transport', async () => {
    const run = (await seeded().tests.get('3'))!;
    const result = toMicrocksA2aTestResult(run);
    expect(result).toMatchObject({ id: '3', testNumber: 3, runnerType: 'A2A_CONFORMANCE', success: false, inProgress: false, testDate: Date.parse('2026-11-03T08:10:04Z') });
    expect(result.testCaseResults?.[0]).toMatchObject({ operationName: 'schema', success: true, testStepResults: [{ requestName: '*' }] });
    expect(result.testCaseResults?.find((c) => c.operationName === 'eclair-size-m')?.success).toBe(false);
  });

  it('reads back the conformance matrix unchanged, and a run without one from its TestResult', async () => {
    const run = (await seeded().tests.get('3'))!;
    expect(toAgentTestRun({ id: '3' }, roundTrip(toA2aConformance(run)))).toEqual(run);
    const bare = toAgentTestRun({ id: '9', setup: run.setup, startedAt: '2026-11-03T09:10:04Z' });
    expect(bare).toEqual({ id: '9', setup: run.setup, startedAt: '2026-11-03T09:10:04Z', launchedBy: '', checks: [], details: {}, failures: [] });
  });

  it('derives the failures from the failing cells', () => {
    const checks: AgentCheck[] = [
      { row: 'schema', transport: '*', result: 'pass', ms: 10 },
      { row: 'eclair-size-m', transport: 'http', result: 'fail', ms: 900, note: 'new task' },
    ];
    const run = toAgentTestRun({ id: '5' }, { checks });
    expect(run.failures).toEqual([{ row: 'eclair-size-m', transport: 'http', cause: 'new task' }]);
    expect(run.details[cellKey('schema', '*')]).toBeUndefined();
  });
});

describe('adapters over a backend without the demo extensions', () => {
  /** Microcks with the agent as an `A2A` service, a plain A2A tasks list, and none of the `/api/agents` payloads. */
  function backend(): HttpClient {
    const get = async (path: string): Promise<unknown> => {
      if (path === 'services/concierge') return CONCIERGE_SERVICE;
      if (path === 'services/pastry2') return { ...CONCIERGE_SERVICE, id: 'pastry2', type: 'REST' };
      if (path === 'agents/concierge/tasks') return { tasks: [{ id: 't1', status: { state: 'TASK_STATE_COMPLETED', timestamp: '2026-11-03T09:00:04Z' } }] };
      throw new NotFoundError('Resource', path);
    };
    const post = async (path: string): Promise<unknown> => {
      if (path === 'agents/concierge/tasks/t1:cancel') throw new BackendError('TaskNotCancelableError: t1 is completed.', 409);
      if (path === 'tests') return { id: '65f0c1', testNumber: 4, testDate: Date.parse('2026-11-03T09:10:04Z'), runnerType: 'A2A_CONFORMANCE', inProgress: true };
      throw new Error(`unexpected POST ${path}`);
    };
    const unexpected = async () => {
      throw new Error('unexpected call');
    };
    return { get, post, put: unexpected, patch: unexpected, delete: unexpected } as unknown as HttpClient;
  }
  const adapters = () => createHttpAgentsAdapters({ http: backend(), clock: new FixedClock() });

  it('reads the agent from the service, and no agent for a service of another type', async () => {
    expect((await adapters().agents.get('concierge'))?.name).toBe('Pastry concierge');
    expect(await adapters().agents.get('pastry2')).toBeUndefined();
    expect(await adapters().agents.get('nope')).toBeUndefined();
  });

  it('lists plain A2A tasks and maps TaskNotCancelableError (409) to a ValidationError', async () => {
    expect(await adapters().tasks.list('concierge')).toMatchObject([{ id: 't1', state: 'completed', live: false, updatedSecondsAgo: 600 }]);
    await expect(adapters().tasks.cancel('concierge', 't1', 'MA')).rejects.toBeInstanceOf(ValidationError);
  });

  it('builds the test form from the agent and runs a test known only by its TestResult', async () => {
    const defaults = (await adapters().tests.defaults('concierge'))!;
    expect(defaults.setup.serviceId).toBe('concierge');
    const setup = { ...defaults.setup, cardUrl: 'https://concierge.acme.io/.well-known/agent-card.json', transports: ['jsonrpc' as const], conversations: ['c1'] };
    expect(await adapters().tests.run(setup)).toMatchObject({ id: '65f0c1', setup, startedAt: '2026-11-03T09:10:04Z', checks: [] });
    expect(await adapters().tests.get('65f0c1')).toBeUndefined();
  });
});

describe('MSW handlers', () => {
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('let a POST /api/tests of another runner through to the testing handlers', async () => {
    const http = createHttpClient({ baseUrl: CONTRACT_API_BASE_URL });
    const result = await http.post<{ serviceId: string; runnerType: string }>('tests', { serviceId: 'pastry2', testEndpoint: 'https://pastry.staging.acme.io/v2', runnerType: 'OPEN_API_SCHEMA', timeout: 5000 });
    expect(result).toMatchObject({ serviceId: 'pastry2', runnerType: 'OPEN_API_SCHEMA' });
  });

  it('answer an A2A_CONFORMANCE POST /api/tests with a Microcks TestResult, its matrix at /api/tests/{id}/a2a', async () => {
    const http = createHttpClient({ baseUrl: CONTRACT_API_BASE_URL });
    const { setup } = (await seeded().tests.defaults('concierge'))!;
    const result = await http.post<{ id: string; runnerType: string }>('tests', toA2aTestRequest({ ...setup, transports: ['jsonrpc'], conversations: ['millefeuille-for-dessert'] }));
    expect(result).toMatchObject({ runnerType: 'A2A_CONFORMANCE' });
    expect((await http.get<{ checks: AgentCheck[] }>(`tests/${result.id}/a2a`)).checks.length).toBeGreaterThan(0);
  });
});
