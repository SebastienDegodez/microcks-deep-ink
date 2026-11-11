import type { AnyHandler } from 'msw';
import { createAgentsHandlers } from './agents';
import { createArazzoHandlers } from './arazzo';
import { createCatalogHandlers } from './catalog';
import { createCopilotHandlers } from './copilot';
import { createGovernHandlers } from './govern';
import { createImportingHandlers } from './importing';
import { createLatencyHandlers } from './latency';
import { createObserveHandlers } from './observe';
import { createTestingHandlers } from './testing';

export { API } from './api';

/**
 * Every feature's handlers (`./<feature>.ts`), shared by the browser worker and the vitest server. The agents handlers
 * come before the testing ones: they answer `POST /api/tests` for the `A2A_CONFORMANCE` runner and let the others through.
 * The latency handler comes first: it only waits (simulated network delay), then lets the request through.
 */
export const handlers: AnyHandler[] = [
  ...createLatencyHandlers(),
  ...createCatalogHandlers(),
  ...createCopilotHandlers(),
  ...createImportingHandlers(),
  ...createAgentsHandlers(),
  ...createTestingHandlers(),
  ...createObserveHandlers(),
  ...createGovernHandlers(),
  // Last: its POC mock URL route (`*/arazzo/...`) must not shadow another feature's.
  ...createArazzoHandlers(),
];
