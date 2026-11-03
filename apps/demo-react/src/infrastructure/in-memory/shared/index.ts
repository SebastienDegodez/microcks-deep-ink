import type { Clock } from '@/application/ports/shared';

export * from './seed-ids';
export * from './clock';
export * from './latency';
export * from './stream';
export * from './services.seed';
export * from './arazzo.seed';
export * from './arazzo-yaml.seed';

/** Dependencies every `createInMemory<Feature>Adapters(deps?)` accepts (all optional). */
export interface InMemoryDeps {
  clock?: Clock;
}
