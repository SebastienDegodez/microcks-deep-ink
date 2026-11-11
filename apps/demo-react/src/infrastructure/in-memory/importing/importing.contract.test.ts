import { describeImportingPortContract } from '@/application/ports/__contracts__/importing.contract';
import { FixedClock } from '@microcks/demo-core/infrastructure/in-memory/shared';
import { createInMemoryImportingAdapters } from '@microcks/demo-core/infrastructure/in-memory/importing';

describeImportingPortContract('in-memory', () => createInMemoryImportingAdapters({ clock: new FixedClock() }));
