import type { Behavior } from '@/domain/catalog';
import type { Operation } from '@/domain/shared';

/** The Behavior prototype opens GET /pastries/{name} with these two constraints. */
const GET_NAME: Behavior = {
  dispatcher: 'URI_PARTS',
  rule: 'name',
  delayMs: 0,
  delayStrategy: 'fixed',
  stateful: false,
  constraints: [
    { name: 'x-api-key', in: 'header', required: true, recopy: false },
    { name: 'size', in: 'query', required: false, recopy: false, mustMatchRegexp: 'S|M|L' },
  ],
};

/** Saved behavior of an operation: the prototype's for `pastry2/get-name`, else what the contract implies. */
export function defaultBehavior(serviceId: string, operation: Operation): Behavior {
  if (serviceId === 'pastry2' && operation.id === 'get-name') return { ...GET_NAME, constraints: GET_NAME.constraints.map((c) => ({ ...c })) };
  return {
    dispatcher: operation.dispatcher,
    rule: operation.rule,
    delayMs: operation.delayMs,
    delayStrategy: 'fixed',
    stateful: false,
    constraints: [],
  };
}
