import { describeTestingPortContract } from '@/application/ports/__contracts__/testing.contract';
import { FixedClock } from '@microcks/demo-core/infrastructure/in-memory/shared';
import { createInMemoryTestingAdapters } from '@microcks/demo-core/infrastructure/in-memory/testing';

describeTestingPortContract('in-memory', () => createInMemoryTestingAdapters({ clock: new FixedClock() }));
