import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * The same handlers as the browser worker, for vitest. Tests call `server.listen({ onUnhandledFrame: 'error' })`
 * in `beforeAll`, `server.resetHandlers()` in `afterEach` and `server.close()` in `afterAll`.
 */
export const server = setupServer(...handlers);
