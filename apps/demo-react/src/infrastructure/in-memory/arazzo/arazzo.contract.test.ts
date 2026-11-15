import { describeArazzoPortContract } from '@/application/ports/__contracts__/arazzo.contract';
import { FixedClock } from '@microcks/demo-core/infrastructure/in-memory/shared';
import { createInMemoryArazzoAdapters } from '@microcks/demo-core/infrastructure/in-memory/arazzo';

describeArazzoPortContract('in-memory', () => createInMemoryArazzoAdapters({ clock: new FixedClock() }));
