/**
 * HTTP adapters of the catalogue: `ServiceCatalog & CatalogExtensions` over the Microcks REST API.
 *
 * Microcks endpoints (Microcks API v1.15, see `./dto.ts`):
 * - `GET /services/count` and `GET /services?page&size`: the catalogue, read page by page;
 * - `GET /services/{id}` and `GET /services/{id}?messages=true`: one service, its operations and their examples;
 * - `GET /services/labels`: the used labels;
 * - `POST /copilot/samples/{id}?operation=<operation name>` (AI Copilot, a JSON `Exchange[]`, 201 with no body):
 *   `addExamples()` of accepted AI proposals. Microcks tags them `sourceArtifact: 'AI Copilot'`, read back as accepted.
 *
 * Demo-only endpoints (`/api/demo/...`, proposition v2 / not in Microcks API): test status, conformance and traffic
 * of the services (`demo/services`), operation extras, example review flags, the other example additions, the full behavior,
 * details, workflow usages and the ⌘K commands. Filtering is done here, over the whole catalogue, with the same
 * domain function as the in-memory adapter (`/services/search` only matches names and labels).
 */
import { filterServices, type Behavior, type CommandItem, type LabelCount, type ServiceDetails, type ServiceFilter, type WorkflowUsage } from '@/domain/catalog';
import type { Example, Operation, ServiceSummary } from '@/domain/shared';
import type { CatalogExtensions } from '@/application/catalog';
import type { ServiceCatalog } from '@/application/ports/catalog';
import type { Clock } from '@/application/ports/shared';
import { NotFoundError } from '@/application/shared';
import type { HttpClient } from '../client';
import type {
  DemoExampleInput,
  DemoServiceExtras,
  MicrocksCounter,
  MicrocksLabelsMap,
  MicrocksService,
  MicrocksServiceView,
} from './dto';
import { fromExchange, fromLabelsMap, fromOperationDto, fromServiceDto, toExchange } from './mapping';

export interface HttpCatalogDeps {
  http: HttpClient;
  clock: Clock;
}

export interface HttpCatalogAdapters {
  catalog: ServiceCatalog & CatalogExtensions;
}

/** `size` of the `GET /services` pages (Microcks' default). */
export const SERVICES_PAGE_SIZE = 20;

const enc = encodeURIComponent;

/** A Copilot proposal a person accepted: Microcks stores it with `POST /copilot/samples/{id}?operation=`. */
const isAcceptedAiExample = (e: Example) => e.aiGenerated === true && e.reviewState === 'accepted';

/** `undefined` instead of a `NotFoundError` (the port answers `undefined` for an unknown id). */
async function orUndefined<T>(read: Promise<T>): Promise<T | undefined> {
  try {
    return await read;
  } catch (error) {
    if (error instanceof NotFoundError) return undefined;
    throw error;
  }
}

export function createHttpCatalogAdapters({ http }: HttpCatalogDeps): HttpCatalogAdapters {
  async function allServices(): Promise<MicrocksService[]> {
    const { counter } = await http.get<MicrocksCounter>('services/count');
    const pages = Math.max(1, Math.ceil(counter / SERVICES_PAGE_SIZE));
    const results = await Promise.all(
      Array.from({ length: pages }, (_, page) => http.get<MicrocksService[]>('services', { query: { page, size: SERVICES_PAGE_SIZE } })),
    );
    return results.flat();
  }

  /** The service (with its messages when asked) and its demo extras, or undefined when unknown. */
  async function service(id: string, messages = false): Promise<{ view: MicrocksServiceView; extras: DemoServiceExtras } | undefined> {
    const [read, extras] = await Promise.all([
      orUndefined(http.get<MicrocksService | MicrocksServiceView>(`services/${enc(id)}`, messages ? { query: { messages: true } } : {})),
      orUndefined(http.get<DemoServiceExtras>(`demo/services/${enc(id)}`)),
    ]);
    if (!read || !extras) return undefined;
    const view = 'service' in read ? read : { service: read, messagesMap: {} };
    return { view, extras };
  }

  const operationsOf = ({ view, extras }: { view: MicrocksServiceView; extras: DemoServiceExtras }): Operation[] =>
    (view.service.operations ?? []).map((o) => fromOperationDto(o, extras.operations[o.name]));

  /**
   * Microcks' operation name (`GET /pastries/{name}`) of a domain operation id, from the demo extras; a plain Microcks
   * has none (404) and its operation ids already are the operation names (see `fromOperationDto`).
   */
  async function microcksOperationName(id: string, opId: string): Promise<string> {
    const operations = (await orUndefined(http.get<DemoServiceExtras>(`demo/services/${enc(id)}`)))?.operations ?? {};
    return Object.keys(operations).find((name) => operations[name]?.id === opId) ?? opId;
  }

  const operationPath = (id: string, opId: string) => `demo/services/${enc(id)}/operations/${enc(opId)}`;

  const catalog: ServiceCatalog & CatalogExtensions = {
    async list(filter: ServiceFilter = {}): Promise<ServiceSummary[]> {
      const [services, extras] = await Promise.all([allServices(), http.get<DemoServiceExtras[]>('demo/services')]);
      const extrasById = new Map(extras.map((e) => [e.id, e]));
      const summaries = services.flatMap((s) => {
        const e = extrasById.get(s.id);
        return e ? [fromServiceDto(s, e)] : [];
      });
      return filterServices(summaries, filter);
    },
    async get(id) {
      const found = await service(id);
      return found && fromServiceDto(found.view.service, found.extras);
    },
    async operations(id) {
      const found = await service(id);
      return found ? operationsOf(found) : [];
    },
    async operation(id, opId) {
      return (await catalog.operations(id)).find((o) => o.id === opId);
    },
    async examples(id, opId): Promise<Example[]> {
      const found = await service(id, true);
      if (!found) return [];
      const name = Object.keys(found.extras.operations).find((n) => found.extras.operations[n]?.id === opId) ?? opId;
      const reviews = found.extras.operations[name]?.reviews ?? {};
      return (found.view.messagesMap[name] ?? []).map((exchange) => {
        const example = fromExchange(exchange);
        const review = reviews[example.id];
        return review ? fromExchange(exchange, review) : example;
      });
    },
    async addExamples(id, opId, examples) {
      // Accepted Copilot proposals go to Microcks' own endpoint; the other examples have no Microcks API.
      const accepted = examples.filter(isAcceptedAiExample);
      const others = examples.filter((e) => !isAcceptedAiExample(e));
      if (accepted.length > 0) {
        const operation = await microcksOperationName(id, opId);
        await http.post(`copilot/samples/${enc(id)}`, accepted.map((e) => toExchange(e, operation)), { query: { operation } });
      }
      if (others.length === 0) return;
      const body: DemoExampleInput[] = others.map((e) => ({
        exchange: toExchange(e, opId),
        ...(e.aiGenerated !== undefined ? { aiGenerated: e.aiGenerated } : {}),
        ...(e.reviewState ? { reviewState: e.reviewState } : {}),
      }));
      await http.post(`${operationPath(id, opId)}/examples`, body);
    },
    async removeExample(id, opId, exampleId) {
      await http.delete(`${operationPath(id, opId)}/examples/${enc(exampleId)}`);
    },
    behavior: (id, opId) => orUndefined(http.get<Behavior>(`${operationPath(id, opId)}/behavior`)),
    async saveBehavior(id, opId, behavior) {
      await http.put(`${operationPath(id, opId)}/behavior`, behavior);
    },
    workflowUsages: (id) => http.get<WorkflowUsage[]>(`demo/services/${enc(id)}/workflow-usages`),
    details: (id) => orUndefined(http.get<ServiceDetails>(`demo/services/${enc(id)}/details`)),
    async labels(): Promise<LabelCount[]> {
      const [labels, services] = await Promise.all([http.get<MicrocksLabelsMap>('services/labels'), allServices()]);
      return fromLabelsMap(labels, services);
    },
    commands: () => http.get<CommandItem[]>('demo/commands'),
  };
  return { catalog };
}
