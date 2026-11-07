import { describeImportingPortContract } from '@/application/ports/__contracts__/importing.contract';
import { FixedClock } from '../shared';
import { createInMemoryImportingAdapters } from '.';

describeImportingPortContract('in-memory', () => createInMemoryImportingAdapters({ clock: new FixedClock() }));
