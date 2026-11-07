import { describeTestingPortContract } from '@/application/ports/__contracts__/testing.contract';
import { FixedClock } from '../shared';
import { createInMemoryTestingAdapters } from '.';

describeTestingPortContract('in-memory', () => createInMemoryTestingAdapters({ clock: new FixedClock() }));
