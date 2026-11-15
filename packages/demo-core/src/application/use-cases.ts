import type { AgentUseCases } from './agents/index.js';
import type { ArazzoUseCases } from './arazzo/index.js';
import type { CatalogUseCases } from './catalog/index.js';
import type { CopilotUseCases } from './copilot/index.js';
import type { GovernUseCases } from './govern/index.js';
import type { ImportingUseCases } from './importing/index.js';
import type { ObserveUseCases } from './observe/index.js';
import type { TestingUseCases } from './testing/index.js';

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
  agents: AgentUseCases;
}
