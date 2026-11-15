import type { AgentProfile, AgentTask, AgentTestDefaults, AgentTestRunWithDetails, AgentTestSetup } from '../../domain/agents/index.js';
import type { Subscribe } from '../shared/index.js';

/** Agent Cards imported as services, with their skills and scripted conversations. */
export interface AgentRepository {
  get(serviceId: string): Promise<AgentProfile | undefined>;
}

/** Tasks created on the mock of an agent (kept 24 h). */
export interface AgentTaskGateway {
  list(serviceId: string): Promise<AgentTask[]>;
  /** Emits the whole list at every change (1 s tick). */
  watch(serviceId: string): Subscribe<AgentTask[]>;
  /** Fails with a `ValidationError` when the task is already terminal (TaskNotCancelableError). */
  cancel(serviceId: string, taskId: string, by: string): Promise<AgentTask>;
}

/** The A2A conformance runner. */
export interface AgentTestGateway {
  defaults(serviceId: string): Promise<AgentTestDefaults | undefined>;
  run(setup: AgentTestSetup): Promise<AgentTestRunWithDetails>;
  get(runId: string): Promise<AgentTestRunWithDetails | undefined>;
}
