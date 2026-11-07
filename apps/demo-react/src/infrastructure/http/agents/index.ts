/**
 * HTTP adapters of the agents (A2A) feature.
 *
 * Microcks API v1.15 (`api/microcks-openapi-v1.15.yaml`), reused:
 * - `GET /services/{id}`: the agent is a Microcks service of type `A2A` (any other type, or a 404, is "not an agent");
 * - `POST /tests` with `runnerType: 'A2A_CONFORMANCE'`: runs the conformance test; the `TestResult` gives its id.
 * (`A2A` and `A2A_CONFORMANCE` are the demo values already declared by the catalogue and testing wire types; run #3
 * is also listed by the testing API as a Microcks `TestResult`.)
 *
 * Proposition v2 / not in Microcks API (see `./dto.ts`):
 * - `GET /agents/{serviceId}`: card, skills, conversations and transports beyond the Microcks service;
 * - `GET /agents/{serviceId}/tasks`: the tasks the mock created, as an A2A 1.0 `ListTasksResponse`;
 * - `POST /agents/{serviceId}/tasks/{taskId}:cancel`: A2A `CancelTask` (409 `TaskNotCancelableError` on a terminal task);
 * - `GET /agents/{serviceId}/test-defaults`: the agent test form;
 * - `GET /tests/{id}/a2a`: the conformance matrix of a test, and the `a2a` member of its `TestRequest`.
 * Each demo payload is optional where the port allows it: without `/agents/{serviceId}` the agent is built from the
 * service (and its card, if any); without `test-defaults` the form is built from the agent.
 *
 * Live tasks: no feed of tasks exists (no SSE, no WebSocket), so `watch` polls `GET /agents/{serviceId}/tasks` every
 * second, as the in-memory stream ticks: one request in flight at most, missed ticks skipped (`pollingStream`). A
 * service that is not an agent ends the poll at once (no emission).
 */
import type { AgentTask } from '@/domain/agents';
import type { AgentRepository, AgentTaskGateway, AgentTestGateway } from '@/application/ports/agents';
import type { Clock } from '@/application/ports/shared';
import { BackendError, NotFoundError, ValidationError } from '@/application/shared';
import type { MicrocksService } from '@/infrastructure/http/catalog/dto';
import type { HttpClient } from '@/infrastructure/http/client';
import { pollingStream } from '@/infrastructure/http/polling';
import { toIsoDate, type MicrocksTestResult } from '@/infrastructure/http/testing/microcks';
import type { A2aCancelTaskRequest, A2aListTasksResponse, A2aTask, DemoA2aConformance, DemoAgentProfile, DemoAgentTestDefaults } from './dto';
import { fromA2aTask, toA2aTestRequest, toAgentProfile, toAgentTestDefaults, toAgentTestRun } from './mapping';

export interface HttpAgentsDeps {
  http: HttpClient;
  clock: Clock;
}

export interface HttpAgentsAdapters {
  agents: AgentRepository;
  tasks: AgentTaskGateway;
  tests: AgentTestGateway;
}

/** Same pace as the in-memory task stream. */
export const TASKS_POLL_MS = 1000;
/** Pages of `ListTasks` read per call at most (the mock keeps 24 h of tasks). */
const MAX_TASK_PAGES = 10;

/** The answer, or `undefined` when the resource does not exist. */
async function optional<T>(request: Promise<T>): Promise<T | undefined> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof NotFoundError) return undefined;
    throw error;
  }
}

export function createHttpAgentsAdapters({ http, clock }: HttpAgentsDeps): HttpAgentsAdapters {
  const enc = encodeURIComponent;

  async function agentService(serviceId: string): Promise<MicrocksService | undefined> {
    const service = await optional(http.get<MicrocksService>(`services/${enc(serviceId)}`));
    return service?.type === 'A2A' ? service : undefined;
  }

  const agents: AgentRepository = {
    async get(serviceId) {
      const service = await agentService(serviceId);
      if (!service) return undefined;
      return toAgentProfile(service, await optional(http.get<DemoAgentProfile>(`agents/${enc(serviceId)}`)));
    },
  };

  async function listTasks(serviceId: string, signal?: AbortSignal): Promise<AgentTask[]> {
    const tasks: A2aTask[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < MAX_TASK_PAGES; page += 1) {
      const answer = await http.get<A2aListTasksResponse>(`agents/${enc(serviceId)}/tasks`, { query: { pageToken }, signal });
      tasks.push(...(answer?.tasks ?? []));
      pageToken = answer?.nextPageToken || undefined;
      if (!pageToken) break;
    }
    const now = clock.now();
    return tasks.map((t) => fromA2aTask(t, now));
  }

  const tasks: AgentTaskGateway = {
    list: (serviceId) => listTasks(serviceId),
    // One "item" per poll: the whole list (the feed has no position, `after` is unused).
    watch: (serviceId) =>
      pollingStream<AgentTask[]>(async (_after, signal) => [await listTasks(serviceId, signal)], {
        intervalMs: TASKS_POLL_MS,
        seq: () => 0,
        isFatal: (error) => error instanceof NotFoundError,
      }),
    async cancel(serviceId, taskId, by) {
      const body: A2aCancelTaskRequest = { metadata: { microcks: { by } } };
      try {
        const task = await http.post<A2aTask>(`agents/${enc(serviceId)}/tasks/${enc(taskId)}:cancel`, body);
        return fromA2aTask(task, clock.now());
      } catch (error) {
        // A2A HTTP+JSON binding: TaskNotCancelableError is a 409 Conflict.
        if (error instanceof BackendError && error.status === 409) throw new ValidationError(error.message);
        throw error;
      }
    },
  };

  const tests: AgentTestGateway = {
    async defaults(serviceId) {
      const profile = await agents.get(serviceId);
      if (!profile) return undefined;
      return toAgentTestDefaults(profile, await optional(http.get<DemoAgentTestDefaults>(`agents/${enc(serviceId)}/test-defaults`)));
    },
    async run(setup) {
      const result = await http.post<MicrocksTestResult>('tests', toA2aTestRequest(setup));
      const id = String(result.id);
      const matrix = await optional(http.get<DemoA2aConformance>(`tests/${enc(id)}/a2a`));
      return toAgentTestRun({ id, setup, startedAt: Number.isFinite(result.testDate) ? toIsoDate(result.testDate) : undefined }, matrix);
    },
    async get(runId) {
      const matrix = await optional(http.get<DemoA2aConformance>(`tests/${enc(runId)}/a2a`));
      return matrix ? toAgentTestRun({ id: runId }, matrix) : undefined;
    },
  };

  return { agents, tasks, tests };
}
