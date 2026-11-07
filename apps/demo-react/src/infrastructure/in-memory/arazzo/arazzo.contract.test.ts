import { describeArazzoPortContract } from '@/application/ports/__contracts__/arazzo.contract';
import { FixedClock } from '../shared';
import { createInMemoryArazzoAdapters } from '.';

describeArazzoPortContract('in-memory', () => createInMemoryArazzoAdapters({ clock: new FixedClock() }));
