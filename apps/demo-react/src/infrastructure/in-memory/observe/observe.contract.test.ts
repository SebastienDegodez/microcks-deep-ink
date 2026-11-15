import { describeObservePortContract } from '@/application/ports/__contracts__/observe.contract';
import { FixedClock } from '@microcks/demo-core/infrastructure/in-memory/shared';
import { createInMemoryObserveAdapters } from '@microcks/demo-core/infrastructure/in-memory/observe';

describeObservePortContract('in-memory', () => createInMemoryObserveAdapters({ clock: new FixedClock() }));
