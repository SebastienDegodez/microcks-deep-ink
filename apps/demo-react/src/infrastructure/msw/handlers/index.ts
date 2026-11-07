import type { AnyHandler } from 'msw';
import { createArazzoHandlers } from './arazzo';
import { createCatalogHandlers } from './catalog';
import { createGovernHandlers } from './govern';
import { createImportingHandlers } from './importing';
import { createObserveHandlers } from './observe';
import { createTestingHandlers } from './testing';

export { API } from './api';

/** Every feature's handlers (`./<feature>.ts`), shared by the browser worker and the vitest server. */
export const handlers: AnyHandler[] = [
  ...createCatalogHandlers(),
  ...createImportingHandlers(),
  ...createTestingHandlers(),
  ...createObserveHandlers(),
  ...createGovernHandlers(),
  // Last: its POC mock URL route (`*/arazzo/...`) must not shadow another feature's.
  ...createArazzoHandlers(),
];
