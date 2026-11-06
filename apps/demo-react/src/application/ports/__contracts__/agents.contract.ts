import { describe, expect, it } from 'vitest';
import { cellKey, type AgentTask } from '@/domain/agents';
import type { AgentPorts } from '@/application/agents';
import { collect, expectNotFound, expectSilentAfterUnsubscribe, expectValidationError, useAdapters, useFakeTimers, type MakeAdapters } from './support.contract';

const AGENT = 'concierge';

/** Contract of `AgentRepository`, `AgentTaskGateway` and `AgentTestGateway` over the Pastry concierge (A2A). */
export function describeAgentsPortContract(name: string, makeAdapters: MakeAdapters<AgentPorts>): void {
  describe(`agents ports contract · ${name}`, () => {
    // The task list moves with time (1 s clock): every test starts at the demo clock with fake timers.
    useFakeTimers();
    const adapters = useAdapters(makeAdapters);

    describe('AgentRepository.get', () => {
      it('returns the Pastry concierge with 3 skills, 3 transports and 4 scripted conversations', async () => {
        const agent = await adapters().agents.get(AGENT);
        expect(agent?.skills.map((s) => s.id)).toEqual(['recommend-pastry', 'order-pastry', 'track-order']);
        expect(agent?.transports.map((t) => t.binding)).toEqual(['JSONRPC', 'HTTP+JSON', 'GRPC']);
        expect(agent?.conversations).toHaveLength(4);
      });

      it('returns undefined for a service that is not an agent', async () => {
        expect(await adapters().agents.get('pastry2')).toBeUndefined();
      });
    });

    describe('AgentTaskGateway.list', () => {
      it('lists the tasks of the mock, task-9a04 still working and streamed', async () => {
        const tasks = await adapters().tasks.list(AGENT);
        expect(tasks.map((t) => t.id)).toEqual(['task-9a04', 'task-5e27', 'task-41b8', 'task-c3f0', 'task-2f6d', 'task-7e11', 'task-0b93']);
        expect(tasks[0]).toMatchObject({ id: 'task-9a04', state: 'working', live: true });
      });

      it('fails with NotFoundError for a service that is not an agent', async () => {
        await expectNotFound(adapters().tasks.list('pastry2'));
      });
    });

    describe('AgentTaskGateway.watch', () => {
      it('emits the whole list every second: task-9a04 completes at 5 s, task-d3a1 arrives at 8 s', async () => {
        const { values, unsubscribe } = await collect<AgentTask[]>(adapters().tasks.watch(AGENT), 9000);
        expect(values).toHaveLength(9);
        expect(values[3]?.find((t) => t.id === 'task-9a04')?.state).toBe('working');
        expect(values[4]?.find((t) => t.id === 'task-9a04')?.state).toBe('completed');
        expect(values[7]?.[0]).toMatchObject({ id: 'task-d3a1', state: 'submitted' });
        expect(values[8]?.[0]).toMatchObject({ id: 'task-d3a1', state: 'completed' });
        await expectSilentAfterUnsubscribe(values, unsubscribe, 3000);
      });

      it('never emits for a service that is not an agent', async () => {
        const { values, unsubscribe } = await collect<AgentTask[]>(adapters().tasks.watch('pastry2'), 3000);
        unsubscribe();
        expect(values).toEqual([]);
      });
    });

    describe('AgentTaskGateway.cancel', () => {
      it('cancels a task waiting for input, visible on the next read', async () => {
        const canceled = await adapters().tasks.cancel(AGENT, 'task-5e27', 'MA');
        expect(canceled).toMatchObject({ id: 'task-5e27', state: 'canceled' });
        expect(canceled.history.at(-1)?.text).toContain('CancelTask by MA');
        expect((await adapters().tasks.list(AGENT)).find((t) => t.id === 'task-5e27')?.state).toBe('canceled');
      });

      it('refuses to cancel a terminal task with ValidationError (TaskNotCancelableError)', async () => {
        await expectValidationError(adapters().tasks.cancel(AGENT, 'task-41b8', 'MA'));
      });

      it('fails with NotFoundError for an unknown task or a service that is not an agent', async () => {
        await expectNotFound(adapters().tasks.cancel(AGENT, 'nope', 'MA'));
        await expectNotFound(adapters().tasks.cancel('pastry2', 'task-5e27', 'MA'));
      });
    });

    describe('AgentTestGateway.defaults / get', () => {
      it('offers the 3 transports and announces run #4 as the next one', async () => {
        const defaults = await adapters().tests.defaults(AGENT);
        expect(defaults?.setup.transports).toEqual(['jsonrpc', 'http', 'grpc']);
        expect(defaults?.nextRunId).toBe('4');
        expect(await adapters().tests.defaults('pastry2')).toBeUndefined();
      });

      it('holds run #3 with the two failing cells, and nothing else', async () => {
        const run = await adapters().tests.get('3');
        expect(run?.failures.map((f) => f.cause)).toEqual(['new taskId after input-required', 'stream closed without lastChunk: true']);
        expect(run?.details[cellKey('eclair-size-m', 'http')]?.kind).toBe('lanes');
        expect(await adapters().tests.get('4')).toBeUndefined();
      });
    });

    describe('AgentTestGateway.run', () => {
      it('runs a setup as run #4, readable afterwards, and moves the next run id', async () => {
        const defaults = (await adapters().tests.defaults(AGENT))!;
        const run = await adapters().tests.run({ ...defaults.setup, transports: ['jsonrpc'], conversations: ['millefeuille-for-dessert'] });
        expect(run.id).toBe('4');
        expect(run.checks.every((c) => c.result !== 'fail')).toBe(true);
        expect((await adapters().tests.get('4'))?.checks).toHaveLength(run.checks.length);
        expect((await adapters().tests.defaults(AGENT))?.nextRunId).toBe('5');
      });

      it('fails with NotFoundError for a service that is not an agent', async () => {
        const defaults = (await adapters().tests.defaults(AGENT))!;
        await expectNotFound(adapters().tests.run({ ...defaults.setup, serviceId: 'pastry2' }));
      });
    });
  });
}
