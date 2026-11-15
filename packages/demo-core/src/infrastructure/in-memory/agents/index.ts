import { isTerminalTaskState, type AgentTask, type AgentTestRunWithDetails } from '../../../domain/agents/index.js';
import { NotFoundError, ValidationError } from '../../../application/shared/index.js';
import type { AgentRepository, AgentTaskGateway, AgentTestGateway } from '../../../application/ports/agents.js';
import { after, type InMemoryDeps } from '../shared/index.js';
import { clearInterval, setInterval } from '../shared/timers.js';
import { CONCIERGE_ID, conciergeProfile } from './seed/concierge.js';
import { agentTestDefaults, executeAgentTest } from './seed/conformance.js';
import { tasksAt } from './seed/tasks.js';

export interface AgentAdapters {
  agents: AgentRepository;
  tasks: AgentTaskGateway;
  tests: AgentTestGateway;
}

/** Id of the run that the Cockpit and the Tests history already list (run #3 of Pastry concierge). */
export const SEED_AGENT_RUN_ID = '3';
/** Start of run #3, as in the Tests history. */
export const SEED_AGENT_RUN_STARTED_AT = '2026-11-03T08:10:04Z';

/**
 * In-memory A2A adapters: the Pastry concierge profile, the tasks its mock creates (a 1 s clock, `task-9a04` streams
 * its artifact) and the conformance runner that fails the same two cells every time.
 */
export function createInMemoryAgentAdapters(deps: InMemoryDeps = {}): AgentAdapters {
  const startedAt = Date.now();
  const canceled: Record<string, number> = {};
  const currentTick = (): number => Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const snapshot = (): AgentTask[] => tasksAt({ tick: currentTick(), canceled });
  const known = (serviceId: string): void => {
    if (serviceId !== CONCIERGE_ID) throw new NotFoundError('Agent', serviceId);
  };

  const runs = new Map<string, AgentTestRunWithDetails>();
  const defaults = agentTestDefaults(CONCIERGE_ID);
  runs.set(SEED_AGENT_RUN_ID, executeAgentTest(SEED_AGENT_RUN_ID, defaults.setup, SEED_AGENT_RUN_STARTED_AT));
  let next = 4;

  const agents: AgentRepository = {
    get: (serviceId) => after(() => (serviceId === CONCIERGE_ID ? conciergeProfile() : undefined)),
  };

  const tasks: AgentTaskGateway = {
    list: (serviceId) => after(() => {
      known(serviceId);
      return snapshot();
    }),
    watch: (serviceId) => (listener) => {
      if (serviceId !== CONCIERGE_ID) return () => undefined;
      const timer = setInterval(() => listener(snapshot()), 1000);
      return () => clearInterval(timer);
    },
    cancel: (serviceId, taskId, by) => after(() => {
      known(serviceId);
      const task = snapshot().find((t) => t.id === taskId);
      if (!task) throw new NotFoundError('Task', taskId);
      if (isTerminalTaskState(task.state)) throw new ValidationError(`TaskNotCancelableError: ${taskId} is ${task.state}.`);
      canceled[taskId] = currentTick();
      void by;
      const updated = snapshot().find((t) => t.id === taskId);
      if (!updated) throw new NotFoundError('Task', taskId);
      return updated;
    }),
  };

  const tests: AgentTestGateway = {
    defaults: (serviceId) => after(() => (serviceId === CONCIERGE_ID ? { ...agentTestDefaults(serviceId), nextRunId: String(next) } : undefined)),
    run: (setup) => after(() => {
      known(setup.serviceId);
      const run = executeAgentTest(String(next), setup, (deps.clock?.now() ?? new Date()).toISOString());
      next += 1;
      runs.set(run.id, run);
      return run;
    }),
    get: (runId) => after(() => runs.get(runId)),
  };

  return { agents, tasks, tests };
}
