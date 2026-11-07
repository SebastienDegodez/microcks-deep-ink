/**
 * Mock of the agents (A2A) API (see `src/infrastructure/http/agents/index.ts` for the endpoints: the Microcks ones it
 * reuses and the routes marked "proposition v2 / not in Microcks API"). The handlers delegate to the in-memory agents
 * adapters (their seeds and their state: a canceled task and a new conformance run are visible on the next read) and
 * serialise the domain into A2A 1.0 / Microcks DTOs. `GET /api/services/{id}` is served by `./catalog.ts`.
 *
 * `POST /api/tests` is shared with `./testing.ts`: these handlers answer an `A2A_CONFORMANCE` request and let any
 * other runner fall through (they are installed before the testing handlers).
 */
import { http, HttpResponse, type HttpHandler } from 'msw';
import { NotFoundError, ValidationError } from '@/application/shared';
import { A2A_RUNNER, type A2aListTasksResponse, type A2aCancelTaskRequest, type MicrocksA2aTestRequest } from '@/infrastructure/http/agents/dto';
import { fromA2aTestRequest, toA2aConformance, toA2aTask, toDemoAgentProfile, toMicrocksA2aTestResult } from '@/infrastructure/http/agents/mapping';
import { FixedClock } from '@/infrastructure/in-memory/shared';
import { createInMemoryAgentAdapters, type AgentAdapters } from '@/infrastructure/in-memory/agents';
import { API } from './api';

const CANCEL_SUFFIX = ':cancel';

/** The application errors of the in-memory adapters, as HTTP statuses (A2A: TaskNotCancelableError is a 409). */
async function answer(produce: () => Promise<Response>, conflict = false): Promise<Response> {
  try {
    return await produce();
  } catch (error) {
    if (error instanceof NotFoundError) return HttpResponse.json({ message: error.message, entity: error.entity, id: error.id }, { status: 404 });
    if (error instanceof ValidationError) return HttpResponse.json({ message: error.message }, { status: conflict ? 409 : 400 });
    throw error;
  }
}

/** Fresh handlers over their own in-memory state (one set for the app, one per contract test). */
export function createAgentsHandlers(adapters: AgentAdapters = createInMemoryAgentAdapters({ clock: new FixedClock() })): HttpHandler[] {
  const { agents, tasks, tests } = adapters;
  const param = (params: Record<string, unknown>, key: string) => String(params[key]);

  return [
    // --- Microcks API v1.15 (an A2A_CONFORMANCE runner is a demo value) -------------------------------------------
    http.post(`${API}/tests`, async ({ request }) => {
      const body = (await request.clone().json().catch(() => undefined)) as MicrocksA2aTestRequest | undefined;
      if (!body || body.runnerType !== A2A_RUNNER) return undefined;
      return answer(async () => {
        const defaults = await tests.defaults(body.serviceId);
        if (!defaults) throw new NotFoundError('Agent', body.serviceId);
        const run = await tests.run(fromA2aTestRequest(body, defaults.setup));
        return HttpResponse.json(toMicrocksA2aTestResult(run), { status: 201 });
      });
    }),

    // --- Proposition v2 / not in Microcks API -----------------------------------------------------------------------
    http.get(`${API}/tests/:id/a2a`, ({ params }) =>
      answer(async () => {
        const run = await tests.get(param(params, 'id'));
        if (!run) throw new NotFoundError('Agent test run', param(params, 'id'));
        return HttpResponse.json(toA2aConformance(run));
      }),
    ),
    http.get(`${API}/agents/:serviceId`, ({ params }) =>
      answer(async () => {
        const profile = await agents.get(param(params, 'serviceId'));
        if (!profile) throw new NotFoundError('Agent', param(params, 'serviceId'));
        return HttpResponse.json(toDemoAgentProfile(profile));
      }),
    ),
    http.get(`${API}/agents/:serviceId/tasks`, ({ params }) =>
      answer(async () => {
        const list = await tasks.list(param(params, 'serviceId'));
        return HttpResponse.json<A2aListTasksResponse>({ tasks: list.map(toA2aTask), nextPageToken: '', pageSize: list.length, totalSize: list.length });
      }),
    ),
    http.post(`${API}/agents/:serviceId/tasks/:taskAction`, async ({ params, request }) => {
      const action = param(params, 'taskAction');
      if (!action.endsWith(CANCEL_SUFFIX)) return HttpResponse.json({ message: `Unsupported task action ${action}` }, { status: 404 });
      const taskId = decodeURIComponent(action.slice(0, -CANCEL_SUFFIX.length));
      const body = (await request.json().catch(() => ({}))) as A2aCancelTaskRequest;
      return answer(async () => HttpResponse.json(toA2aTask(await tasks.cancel(param(params, 'serviceId'), taskId, body.metadata?.microcks?.by ?? ''))), true);
    }),
    http.get(`${API}/agents/:serviceId/test-defaults`, ({ params }) =>
      answer(async () => {
        const defaults = await tests.defaults(param(params, 'serviceId'));
        if (!defaults) throw new NotFoundError('Agent', param(params, 'serviceId'));
        return HttpResponse.json(defaults);
      }),
    ),
  ];
}
