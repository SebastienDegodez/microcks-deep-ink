import type { AnyHandler } from 'msw';
import { createAgentsHandlers } from './agents';
import { createCatalogHandlers } from './catalog';
import { createGovernHandlers } from './govern';
import { createImportingHandlers } from './importing';
import { createObserveHandlers } from './observe';
import { createTestingHandlers } from './testing';

export { API } from './api';

/**
 * Every feature's handlers (`./<feature>.ts`), shared by the browser worker and the vitest server. The agents handlers
 * come before the testing ones: they answer `POST /api/tests` for the `A2A_CONFORMANCE` runner and let the others through.
 */
export const handlers: AnyHandler[] = [
  ...createCatalogHandlers(),
  ...createImportingHandlers(),
  ...createAgentsHandlers(),
  ...createTestingHandlers(),
  ...createObserveHandlers(),
  ...createGovernHandlers(),
];
