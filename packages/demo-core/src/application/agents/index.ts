import { isTerminalTaskState, validateSetup, type AgentProfile, type AgentTask, type AgentTestDefaults, type AgentTestRunWithDetails, type AgentTestSetup } from '../../domain/agents/index.js';
import { NotFoundError, ValidationError, type Unsubscribe } from '../shared/index.js';
import type { AgentRepository, AgentTaskGateway, AgentTestGateway } from '../ports/agents.js';

export type AgentPorts = {
  agents: AgentRepository;
  tasks: AgentTaskGateway;
  tests: AgentTestGateway;
};

export interface AgentUseCases {
  /** The agent behind an A2A service: card, skills, conversations, transports. */
  getAgent(serviceId: string): Promise<AgentProfile>;
  /** Tasks created on the mock, newest first. */
  listTasks(serviceId: string): Promise<AgentTask[]>;
  /** Live list of tasks (1 s tick). */
  subscribeTasks(serviceId: string, listener: (tasks: AgentTask[]) => void): Unsubscribe;
  /** Cancels a live task. A terminal task answers TaskNotCancelableError. */
  cancelTask(serviceId: string, taskId: string, by: string): Promise<AgentTask>;
  /** What the agent test form offers, with its defaults. */
  testDefaults(serviceId: string): Promise<AgentTestDefaults>;
  /** Runs the conformance test. The result is complete; the page replays it step by step. */
  runConformance(setup: AgentTestSetup): Promise<AgentTestRunWithDetails>;
  getTestRun(runId: string): Promise<AgentTestRunWithDetails>;
}

export function createAgentUseCases(ports: AgentPorts): AgentUseCases {
  return {
    getAgent: async (serviceId) => {
      const agent = await ports.agents.get(serviceId);
      if (!agent) throw new NotFoundError('Agent', serviceId);
      return agent;
    },
    listTasks: (serviceId) => ports.tasks.list(serviceId),
    subscribeTasks: (serviceId, listener) => ports.tasks.watch(serviceId)(listener),
    cancelTask: async (serviceId, taskId, by) => {
      const tasks = await ports.tasks.list(serviceId);
      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new NotFoundError('Task', taskId);
      if (isTerminalTaskState(task.state)) throw new ValidationError(`TaskNotCancelableError: ${taskId} is ${task.state}.`);
      return ports.tasks.cancel(serviceId, taskId, by);
    },
    testDefaults: async (serviceId) => {
      const defaults = await ports.tests.defaults(serviceId);
      if (!defaults) throw new NotFoundError('Agent', serviceId);
      return defaults;
    },
    runConformance: async (setup) => {
      const problem = validateSetup(setup);
      if (problem) throw new ValidationError(problem);
      return ports.tests.run(setup);
    },
    getTestRun: async (runId) => {
      const run = await ports.tests.get(runId);
      if (!run) throw new NotFoundError('Agent test run', runId);
      return run;
    },
  };
}
