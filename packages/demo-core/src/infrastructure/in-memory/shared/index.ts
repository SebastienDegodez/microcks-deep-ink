import type { Clock } from '../../../application/ports/shared.js';

export * from './seed-ids.js';
export * from './clock.js';
export * from './latency.js';
export * from './stream.js';
export * from './services.seed.js';
export * from './arazzo.seed.js';
export * from './arazzo-yaml.seed.js';

/** Dependencies every `createInMemory<Feature>Adapters(deps?)` accepts (all optional). */
export interface InMemoryDeps {
  clock?: Clock;
}
