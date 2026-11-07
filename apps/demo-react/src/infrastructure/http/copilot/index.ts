/**
 * HTTP adapters of the Copilot: `CopilotGateway & CopilotExtensions`.
 *
 * Microcks endpoint reused (AI Copilot, `AICopilotController`, see `./dto.ts`):
 * - `GET /copilot/samples/{serviceId}?operation=<operation name>`: `suggestExamples()`. Microcks names an operation
 *   `<METHOD> <path>` (`GET /pastries/{name}`): the name of the domain operation id is read from the demo extras of
 *   the service (`GET /demo/services/{id}`); without them (404, a plain Microcks) the id already IS the operation name,
 *   as the catalogue adapters map it. The answer is synchronous (Microcks generates two exchanges per call): no
 *   progress stream is invented, the page shows its own progress while the request is in flight.
 *   The `count` and `hint` query parameters are proposition v2 / not in Microcks API (Microcks ignores them and
 *   always proposes two); the adapter keeps at most `count` proposals, and always at least one when some came back.
 *
 * Proposition v2 / not in Microcks API:
 * - `GET /copilot/workflow-context/{serviceId}?hint=`: `workflowContext()`, 204 when no run lacks that example; a
 *   backend without the route (404) has no context. No request is sent without a hint.
 *
 * Accepting a proposal goes through the catalogue port (`catalog.addExamples`), editing and discarding stay in the
 * page until then: nothing of a proposal is stored on the server before it is accepted.
 */
import type { WorkflowContext } from '@/domain/copilot';
import type { CopilotExtensions } from '@/application/copilot';
import type { CopilotGateway } from '@/application/ports/copilot';
import type { Clock } from '@/application/ports/shared';
import { NotFoundError } from '@/application/shared';
import type { HttpClient } from '@/infrastructure/http/client';
import type { DemoServiceExtras } from '@/infrastructure/http/catalog/dto';
import type { DemoWorkflowContext, MicrocksSuggestedExchange } from './dto';
import { fromSuggestedExchanges } from './mapping';

export interface HttpCopilotDeps {
  http: HttpClient;
  clock: Clock;
}

export interface HttpCopilotAdapters {
  copilot: CopilotGateway & CopilotExtensions;
}

const enc = encodeURIComponent;

async function orUndefined<T>(read: Promise<T>): Promise<T | undefined> {
  try {
    return await read;
  } catch (error) {
    if (error instanceof NotFoundError) return undefined;
    throw error;
  }
}

export function createHttpCopilotAdapters({ http }: HttpCopilotDeps): HttpCopilotAdapters {
  /** Microcks' name of the operation (`GET /pastries/{name}`) for a domain operation id (`get-name`). */
  async function operationName(serviceId: string, opId: string): Promise<string> {
    const extras = await orUndefined(http.get<DemoServiceExtras>(`demo/services/${enc(serviceId)}`));
    const operations = extras?.operations ?? {};
    return Object.keys(operations).find((name) => operations[name]?.id === opId) ?? opId;
  }

  const copilot: CopilotGateway & CopilotExtensions = {
    async suggestExamples(serviceId, opId, { count, hint }) {
      const wanted = Math.max(1, count);
      const operation = await operationName(serviceId, opId);
      const exchanges = await http.get<MicrocksSuggestedExchange[] | null>(`copilot/samples/${enc(serviceId)}`, {
        query: { operation, count: wanted, hint: hint?.trim() || undefined },
      });
      return fromSuggestedExchanges(exchanges ?? [], opId).slice(0, wanted);
    },
    async workflowContext(serviceId, hint): Promise<WorkflowContext | undefined> {
      const wanted = hint?.trim();
      if (!wanted) return undefined;
      const context = await orUndefined(http.get<DemoWorkflowContext | undefined>(`copilot/workflow-context/${enc(serviceId)}`, { query: { hint: wanted } }));
      return context ?? undefined;
    },
  };
  return { copilot };
}
