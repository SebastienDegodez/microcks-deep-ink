/**
 * Mock of the Copilot API (see `src/infrastructure/http/copilot/index.ts` for the endpoints): Microcks'
 * `GET /api/copilot/samples/{serviceId}?operation=` and the demo-only `GET /api/copilot/workflow-context/{serviceId}`
 * (proposition v2 / not in Microcks API). The handlers delegate to the in-memory Copilot (the same deterministic
 * proposals as memory mode) and serialise them into Microcks exchanges (events for an event API, with the demo-only
 * `demo.params` the page shows; request/response pairs with their `dispatchCriteria` otherwise). Accepted proposals are stored by Microcks'
 * `POST /api/copilot/samples/{serviceId}?operation=`, served by `./catalog.ts` (it owns the catalogue state); edits and
 * discards never reach the server.
 */
import { http, HttpResponse, type HttpHandler } from 'msw';
import { operationName, toServiceType } from '@/infrastructure/http/catalog/mapping';
import type { MicrocksSuggestedExchange } from '@/infrastructure/http/copilot/dto';
import { toSuggestedExchange } from '@/infrastructure/http/copilot/mapping';
import { createInMemoryCopilotAdapters, type CopilotAdapters } from '@/infrastructure/in-memory/copilot';
import { FixedClock, OPERATIONS, SERVICES } from '@/infrastructure/in-memory/shared';
import { API } from './api';

/** Microcks proposes two exchanges per call. */
const MICROCKS_SAMPLE_COUNT = 2;

/** Fresh handlers over their own in-memory Copilot (one set for the app, one per contract test). */
export function createCopilotHandlers(adapters: CopilotAdapters = createInMemoryCopilotAdapters({ clock: new FixedClock() })): HttpHandler[] {
  const { copilot } = adapters;
  const badRequest = (message: string) => HttpResponse.json({ message }, { status: 400 });

  return [
    // Microcks AI Copilot.
    http.get(`${API}/copilot/samples/:id`, async ({ params, request }) => {
      const serviceId = String(params.id);
      const url = new URL(request.url);
      const name = url.searchParams.get('operation');
      // Microcks starts an asynchronous generation for every operation without `operation`: not served by the demo.
      if (!name) return badRequest('The demo only generates samples for one operation: `operation` is required');
      const operation = (OPERATIONS[serviceId] ?? []).find((o) => operationName(o) === name || o.id === name);
      if (!operation) return badRequest(`Unknown operation ${name} of service ${serviceId}`);
      const count = Number(url.searchParams.get('count') ?? MICROCKS_SAMPLE_COUNT);
      const hint = url.searchParams.get('hint') ?? undefined;
      const proposals = await copilot.suggestExamples(serviceId, operation.id, { count: Number.isInteger(count) ? count : MICROCKS_SAMPLE_COUNT, hint });
      const service = SERVICES.find((s) => s.id === serviceId);
      const target = { serviceType: service && toServiceType(service.protocol), dispatcher: operation.dispatcher, dispatcherRules: operation.rule };
      return HttpResponse.json<MicrocksSuggestedExchange[]>(proposals.map((p) => toSuggestedExchange(p, operationName(operation), target)));
    }),
    // Proposition v2 / not in Microcks API.
    http.get(`${API}/copilot/workflow-context/:id`, async ({ params, request }) => {
      const hint = new URL(request.url).searchParams.get('hint') ?? undefined;
      const context = await copilot.workflowContext(String(params.id), hint);
      return context ? HttpResponse.json(context) : new HttpResponse(null, { status: 204 });
    }),
  ];
}
