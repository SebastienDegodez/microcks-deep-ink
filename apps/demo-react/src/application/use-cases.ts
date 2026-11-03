import type { ArazzoUseCases } from './arazzo';
import type { CatalogUseCases } from './catalog';
import type { CopilotUseCases } from './copilot';
import type { GovernUseCases } from './govern';
import type { ImportingUseCases } from './importing';
import type { ObserveUseCases } from './observe';
import type { TestingUseCases } from './testing';

/**
 * Everything the UI can do. Pages receive it through `useUseCases()` and never see an adapter.
 * Phase-2 owners may ADD use cases inside their own feature interface; they must not change the others.
 */
export interface UseCases {
  catalog: CatalogUseCases;
  copilot: CopilotUseCases;
  importing: ImportingUseCases;
  testing: TestingUseCases;
  arazzo: ArazzoUseCases;
  observe: ObserveUseCases;
  govern: GovernUseCases;
}
