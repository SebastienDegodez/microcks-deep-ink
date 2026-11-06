import { describeCatalogPortContract } from '@/application/ports/__contracts__/catalog.contract';
import { FixedClock } from '../shared';
import { createInMemoryCatalogAdapters } from '.';

describeCatalogPortContract('in-memory', () => createInMemoryCatalogAdapters({ clock: new FixedClock() }));
