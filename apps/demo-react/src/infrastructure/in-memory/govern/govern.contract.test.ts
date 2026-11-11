import { describeGovernPortContract } from '@/application/ports/__contracts__/govern.contract';
import { FixedClock } from '@microcks/demo-core/infrastructure/in-memory/shared';
import { createInMemoryGovernAdapters } from '@microcks/demo-core/infrastructure/in-memory/govern';

describeGovernPortContract('in-memory', () => createInMemoryGovernAdapters({ clock: new FixedClock() }));
