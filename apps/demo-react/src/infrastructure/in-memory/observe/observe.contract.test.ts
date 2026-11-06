import { describeObservePortContract } from '@/application/ports/__contracts__/observe.contract';
import { FixedClock } from '../shared';
import { createInMemoryObserveAdapters } from '.';

describeObservePortContract('in-memory', () => createInMemoryObserveAdapters({ clock: new FixedClock() }));
