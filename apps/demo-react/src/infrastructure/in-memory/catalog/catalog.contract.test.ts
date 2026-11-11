import { describeCatalogPortContract } from '@/application/ports/__contracts__/catalog.contract';
import { FixedClock } from '@microcks/demo-core/infrastructure/in-memory/shared';
import { createInMemoryCatalogAdapters } from '@microcks/demo-core/infrastructure/in-memory/catalog';

describeCatalogPortContract('in-memory', () => createInMemoryCatalogAdapters({ clock: new FixedClock() }));
