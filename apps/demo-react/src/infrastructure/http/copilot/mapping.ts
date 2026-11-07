/**
 * Pure mappings of the Copilot API (`./dto.ts`): the HTTP adapters read Microcks' suggested exchanges into pending AI
 * examples, the mock API serialises the in-memory proposals into the same exchanges.
 */
import type { Example } from '@/domain/shared';
import { toCopilotExchange, type DispatchTarget } from '@/infrastructure/http/catalog/mapping';
import type { MicrocksSuggestedExchange } from './dto';

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * A proposal as the exchange Microcks' Copilot answers: an event for an event API, else a request/response pair with
 * its `dispatchCriteria` (the demo keeps the ids so proposals stay stable).
 */
export function toSuggestedExchange(example: Example, operation: string, target: DispatchTarget & { event: boolean }): MicrocksSuggestedExchange {
  return toCopilotExchange(example, operation, target);
}

/** One suggested exchange as a pending AI example, or undefined for an exchange the demo does not show. */
function fromSuggestedExchange(exchange: MicrocksSuggestedExchange, opId: string, index: number): Example | undefined {
  const fallbackId = (name: string) => `ai-${slug(opId)}-${slug(name) || index + 1}`;
  if (exchange.type === 'unidirEvent') {
    const message = exchange.eventMessage;
    const name = message?.name || `Generated ${index + 1}`;
    return {
      id: message?.id || fallbackId(name),
      name,
      request: { params: {} },
      response: { status: 200, body: message?.content ?? '' },
      aiGenerated: true,
      reviewState: 'pending',
    };
  }
  if (exchange.type !== 'reqRespPair' || !exchange.response) return undefined;
  const { request, response } = exchange;
  const name = response.name || request?.name || `Generated ${index + 1}`;
  const status = Number(response.status ?? 200);
  return {
    id: response.id || request?.responseId || fallbackId(name),
    name,
    request: {
      params: Object.fromEntries((request?.queryParameters ?? []).map((p) => [p.name, p.value])),
      ...(request?.content ? { body: request.content } : {}),
    },
    response: { status: Number.isFinite(status) ? status : 200, body: response.content ?? '' },
    aiGenerated: true,
    reviewState: 'pending',
  };
}

/**
 * `GET /api/copilot/samples/{id}?operation=` -> pending AI examples. Microcks' exchanges have no id: one is derived
 * from the name (`ai-<opId slug>-<name slug>`), made unique when the LLM repeats a name.
 */
export function fromSuggestedExchanges(exchanges: readonly MicrocksSuggestedExchange[], opId: string): Example[] {
  const seen = new Map<string, number>();
  return exchanges.flatMap((exchange, index) => {
    const example = fromSuggestedExchange(exchange, opId, index);
    if (!example) return [];
    const n = (seen.get(example.id) ?? 0) + 1;
    seen.set(example.id, n);
    return [n === 1 ? example : { ...example, id: `${example.id}-${n}` }];
  });
}
