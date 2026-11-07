import { http, HttpResponse, type AnyHandler } from 'msw';
import type { Example, Operation, ServiceSummary } from '@/domain/shared';
import type { Behavior } from '@/domain/catalog';
import type { Clock } from '@/application/ports/shared';
import type {
  DemoExampleInput,
  DemoServiceExtras,
  MicrocksCounter,
  MicrocksExchange,
  MicrocksService,
  MicrocksServiceView,
} from '@/infrastructure/http/catalog/dto';
import { dispatchCriteriaOf, fromExchange, operationName, toExchange, toLabelsMap, toServiceDto, toServiceExtras } from '@/infrastructure/http/catalog/mapping';
import { createInMemoryCatalogAdapters } from '@/infrastructure/in-memory/catalog';
import { API } from './api';

/**
 * The catalogue API, answered by the in-memory catalogue adapters (one seeded instance per call, so http mode shows
 * the same data as memory mode) and serialised to Microcks DTOs (`src/infrastructure/http/catalog/dto.ts`).
 *
 * Microcks API v1.15: `GET /services/count`, `GET /services?page&size`, `GET /services/labels`,
 * `GET /services/{id}[?messages=true]`, and the AI Copilot's `POST /api/copilot/samples/{id}?operation=` (accept).
 * Demo-only (proposition v2 / not in Microcks API): every `/api/demo/...` route below.
 */
export function createCatalogHandlers(deps: { clock?: Clock } = {}): AnyHandler[] {
  const { catalog } = createInMemoryCatalogAdapters(deps.clock ? { clock: deps.clock } : {});

  const notFound = (entity: string, id: string) => HttpResponse.json({ message: `${entity} ${id} not found`, entity, id }, { status: 404 });
  const noContent = () => new HttpResponse(null, { status: 204 });
  const intParam = (url: URL, name: string, fallback: number) => {
    const value = Number(url.searchParams.get(name));
    return url.searchParams.has(name) && Number.isInteger(value) && value >= 0 ? value : fallback;
  };

  async function serviceDto(service: ServiceSummary): Promise<MicrocksService> {
    const [operations, details] = await Promise.all([catalog.operations(service.id), catalog.details(service.id)]);
    const primary = details?.artifacts.find((a) => a.role === 'primary')?.file ?? `${service.name}-${service.version}`;
    return toServiceDto(service, operations, primary);
  }

  async function extras(service: ServiceSummary, withReviews: boolean): Promise<DemoServiceExtras> {
    const operations = await catalog.operations(service.id);
    const examples: Record<string, Example[]> = withReviews
      ? Object.fromEntries(await Promise.all(operations.map(async (o) => [o.id, await catalog.examples(service.id, o.id)] as const)))
      : {};
    return toServiceExtras(service, operations, examples);
  }

  async function messagesMap(service: ServiceSummary): Promise<Record<string, MicrocksExchange[]>> {
    const operations = await catalog.operations(service.id);
    const entries = await Promise.all(
      operations.map(async (o) => {
        const name = operationName(o);
        const examples = await catalog.examples(service.id, o.id);
        return [name, examples.map((e) => toExchange(e, name, service.protocol))] as const;
      }),
    );
    return Object.fromEntries(entries);
  }

  const id = (params: Record<string, unknown>, key = 'id') => String(params[key]);

  /** Why Microcks would store this accepted exchange but never serve it (wrong exchange type, wrong criteria). */
  function copilotExchangeProblem(exchange: MicrocksExchange, event: boolean, operation: Operation): string | undefined {
    if (event) return exchange.type === 'unidirEvent' ? undefined : `An event operation expects unidirEvent exchanges, not ${exchange.type}`;
    if (exchange.type !== 'reqRespPair') return `A request/response operation expects reqRespPair exchanges, not ${exchange.type}`;
    const params = Object.fromEntries((exchange.request.queryParameters ?? []).map((p) => [p.name, p.value]));
    const expected = dispatchCriteriaOf({ dispatcher: operation.dispatcher, dispatcherRules: operation.rule }, params);
    const actual = exchange.response.dispatchCriteria;
    return expected === undefined || actual === expected ? undefined : `dispatchCriteria ${JSON.stringify(actual ?? null)} would not be served: expected ${JSON.stringify(expected)}`;
  }

  return [
    // --- Microcks API v1.15 -----------------------------------------------------------------------------------------
    http.get(`${API}/services/count`, async () => HttpResponse.json<MicrocksCounter>({ counter: (await catalog.list()).length })),
    http.get(`${API}/services/labels`, async () => HttpResponse.json(toLabelsMap(await catalog.list()))),
    http.get(`${API}/services`, async ({ request }) => {
      const url = new URL(request.url);
      const page = intParam(url, 'page', 0);
      const size = intParam(url, 'size', 20);
      const services = (await catalog.list()).slice(page * size, (page + 1) * size);
      return HttpResponse.json(await Promise.all(services.map(serviceDto)));
    }),
    // AI Copilot: stores accepted proposals (`AICopilotController#addSamplesSuggestions`). Microcks answers 201 with no
    // body, and 403 when the service or the operation is unknown. The exchanges read back as accepted AI examples.
    // Stricter than Microcks (which stores what it gets): 400 for an exchange it would store but never serve.
    http.post(`${API}/copilot/samples/:id`, async ({ params, request }) => {
      const operationNameParam = new URL(request.url).searchParams.get('operation');
      if (!operationNameParam) return HttpResponse.json({ message: 'Required parameter operation is missing' }, { status: 400 });
      const operation = (await catalog.operations(id(params))).find((o) => operationName(o) === operationNameParam);
      if (!operation) return new HttpResponse(null, { status: 403 });
      const exchanges = (await request.json()) as MicrocksExchange[];
      const event = (await catalog.get(id(params)))?.protocol === 'EVENT';
      const invalid = exchanges.map((e) => copilotExchangeProblem(e, event, operation)).find(Boolean);
      if (invalid) return HttpResponse.json({ message: invalid }, { status: 400 });
      const accepted = exchanges.map((e) => fromExchange(e, { aiGenerated: true, reviewState: 'accepted' }));
      await catalog.addExamples(id(params), operation.id, accepted);
      return new HttpResponse(null, { status: 201 });
    }),
    http.get(`${API}/services/:id`, async ({ params, request }) => {
      const service = await catalog.get(id(params));
      if (!service) return notFound('Service', id(params));
      const dto = await serviceDto(service);
      if (new URL(request.url).searchParams.get('messages') !== 'true') return HttpResponse.json(dto);
      return HttpResponse.json<MicrocksServiceView>({ service: dto, messagesMap: await messagesMap(service) });
    }),

    // --- Demo-only: proposition v2 / not in Microcks API ------------------------------------------------------------
    http.get(`${API}/demo/services`, async () => HttpResponse.json(await Promise.all((await catalog.list()).map((s) => extras(s, false))))),
    http.get(`${API}/demo/services/:id`, async ({ params }) => {
      const service = await catalog.get(id(params));
      return service ? HttpResponse.json(await extras(service, true)) : notFound('Service', id(params));
    }),
    http.get(`${API}/demo/services/:id/details`, async ({ params }) => {
      const details = await catalog.details(id(params));
      return details ? HttpResponse.json(details) : notFound('Service', id(params));
    }),
    http.get(`${API}/demo/services/:id/workflow-usages`, async ({ params }) => HttpResponse.json(await catalog.workflowUsages(id(params)))),
    http.get(`${API}/demo/services/:id/operations/:opId/behavior`, async ({ params }) => {
      const behavior = await catalog.behavior(id(params), id(params, 'opId'));
      return behavior ? HttpResponse.json(behavior) : notFound('Operation', id(params, 'opId'));
    }),
    http.put(`${API}/demo/services/:id/operations/:opId/behavior`, async ({ params, request }) => {
      await catalog.saveBehavior(id(params), id(params, 'opId'), (await request.json()) as Behavior);
      return noContent();
    }),
    http.post(`${API}/demo/services/:id/operations/:opId/examples`, async ({ params, request }) => {
      const inputs = (await request.json()) as DemoExampleInput[];
      await catalog.addExamples(id(params), id(params, 'opId'), inputs.map((i) => fromExchange(i.exchange, i)));
      return noContent();
    }),
    http.delete(`${API}/demo/services/:id/operations/:opId/examples/:exampleId`, async ({ params }) => {
      await catalog.removeExample(id(params), id(params, 'opId'), id(params, 'exampleId'));
      return noContent();
    }),
    http.get(`${API}/demo/commands`, async () => HttpResponse.json(await catalog.commands())),
  ];
}
