import type { AnyHandler } from 'msw';
import { createImportingHandlers } from './importing';
import { createTestingHandlers } from './testing';

export { API } from './api';

/** Every feature's handlers (`./<feature>.ts`), shared by the browser worker and the vitest server. */
export const handlers: AnyHandler[] = [...createImportingHandlers(), ...createTestingHandlers()];
