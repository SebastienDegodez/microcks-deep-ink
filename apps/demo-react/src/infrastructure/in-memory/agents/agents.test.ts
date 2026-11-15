import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cellKey } from '@microcks/demo-core/domain/agents';
import { createAgentUseCases } from '@microcks/demo-core/application/agents';
import { createCatalogUseCases } from '@microcks/demo-core/application/catalog';
import { createTestingUseCases } from '@microcks/demo-core/application/testing';
import { createInMemoryCatalogAdapters } from '@microcks/demo-core/infrastructure/in-memory/catalog';
import { createInMemoryImportingAdapters } from '@microcks/demo-core/infrastructure/in-memory/importing';
import { createInMemoryTestingAdapters } from '@microcks/demo-core/infrastructure/in-memory/testing';
import { createInMemoryAgentAdapters } from '@microcks/demo-core/infrastructure/in-memory/agents';

function createUseCases() {
  const catalog = createInMemoryCatalogAdapters();
  const testing = createInMemoryTestingAdapters();
  const importing = createInMemoryImportingAdapters();
  return {
    agents: createAgentUseCases(createInMemoryAgentAdapters()),
    catalog: createCatalogUseCases({ catalog: catalog.catalog }),
    testing: createTestingUseCases({ testRuns: testing.testRuns, catalog: catalog.catalog, secrets: importing.secrets }),
  };
}
import { NotFoundError, ValidationError } from '@microcks/demo-core/application/shared';

describe('agent use cases', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('serves the Pastry concierge with 3 skills, 3 transports and 4 scripted conversations plus a fallback', async () => {
    const agent = await createUseCases().agents.getAgent('concierge');
    expect(agent.skills.map((s) => s.id)).toEqual(['recommend-pastry', 'order-pastry', 'track-order']);
    expect(agent.transports.map((t) => t.binding)).toEqual(['JSONRPC', 'HTTP+JSON', 'GRPC']);
    expect(agent.conversations).toHaveLength(4);
    expect(agent.fallback.steps.at(-1)).toMatchObject({ kind: 'state', state: 'rejected' });
    expect(agent.skills.map((s) => s.lastTest.result)).toEqual(['pass', 'fail', 'fail']);
  });

  it('keeps the catalogue entry in line with the agent: 3 skills, run #3, conformance 83', async () => {
    const uc = createUseCases();
    const service = (await uc.catalog.listServices()).find((s) => s.id === 'concierge');
    expect(service).toMatchObject({ protocol: 'A2A', operationCount: 3, testStatus: 'failed', conformance: 83, calls24h: 64, lastResults: ['pass', 'fail', 'fail'] });
    expect((await uc.testing.get('3')).runner).toBe('A2A_CONFORMANCE');
    await expect(uc.agents.getAgent('pastry2')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('streams task-9a04: baking at 2 s, ready and completed at 5 s, and a new task at 8 s', async () => {
    const uc = createUseCases();
    const first = await uc.agents.listTasks('concierge');
    expect(first.find((t) => t.id === 'task-9a04')).toMatchObject({ state: 'working', live: true });
    expect(first.find((t) => t.id === 'task-d3a1')).toBeUndefined();

    const seen: number[] = [];
    const states: Record<string, string> = {};
    const stop = uc.agents.subscribeTasks('concierge', (tasks) => {
      seen.push(tasks.length);
      for (const t of tasks) states[t.id] = t.state;
    });
    vi.advanceTimersByTime(5000);
    expect(states['task-9a04']).toBe('completed');
    vi.advanceTimersByTime(4000);
    stop();
    expect(states['task-d3a1']).toBe('completed');
    expect(Math.max(...seen)).toBe(8);
  });

  it('cancels a live task and refuses to cancel a terminal one', async () => {
    const uc = createUseCases();
    const canceled = await uc.agents.cancelTask('concierge', 'task-5e27', 'MA');
    expect(canceled.state).toBe('canceled');
    expect(canceled.history.at(-1)?.text).toContain('CancelTask by MA');
    await expect(uc.agents.cancelTask('concierge', 'task-41b8', 'MA')).rejects.toThrow(/TaskNotCancelableError: task-41b8 is completed/);
    await expect(uc.agents.cancelTask('concierge', 'nope', 'MA')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('agent conformance runner', () => {
  it('holds run #3: 13 of 15 conversation checks, one warning, and the two failing cells explained', async () => {
    const uc = createUseCases();
    const run = await uc.agents.getTestRun('3');
    const conv = run.checks.filter((c) => !['schema', 'iface', 'caps', 'sig'].includes(c.row));
    expect(conv).toHaveLength(15);
    expect(conv.filter((c) => c.result === 'fail').map((c) => `${c.row}|${c.transport}`)).toEqual(['eclair-size-m|http', 'ord-2417-ready|grpc']);
    expect(run.checks.find((c) => c.row === 'sig')?.result).toBe('warn');
    expect(run.failures.map((f) => f.cause)).toEqual(['new taskId after input-required', 'stream closed without lastChunk: true']);
    expect(run.details[cellKey('eclair-size-m', 'http')]?.kind).toBe('lanes');
    expect(run.details[cellKey('ord-2417-ready', 'grpc')]?.kind).toBe('stream');
  });

  it('runs a chosen setup and refuses an invalid one', async () => {
    const uc = createUseCases();
    const defaults = await uc.agents.testDefaults('concierge');
    expect(defaults.setup.transports).toEqual(['jsonrpc', 'http', 'grpc']);
    const run = await uc.agents.runConformance({ ...defaults.setup, transports: ['jsonrpc'], conversations: ['millefeuille-for-dessert'] });
    expect(run.id).toBe('4');
    expect(run.checks.every((c) => c.result !== 'fail')).toBe(true);
    expect((await uc.agents.getTestRun('4')).checks).toHaveLength(run.checks.length);
    await expect(uc.agents.runConformance({ ...defaults.setup, transports: [] })).rejects.toBeInstanceOf(ValidationError);
  });
});
