import { describeGovernPortContract } from '@/application/ports/__contracts__/govern.contract';
import { FixedClock } from '../shared';
import { createInMemoryGovernAdapters } from '.';

describeGovernPortContract('in-memory', () => createInMemoryGovernAdapters({ clock: new FixedClock() }));
