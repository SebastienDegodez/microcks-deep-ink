// @vitest-environment node
/**
 * Every feature's port contract over HTTP + MSW: the same suites the in-memory adapters pass
 * (`src/infrastructure/in-memory/<feature>/<feature>.contract.test.ts`).
 *
 * To plug a feature in (E3..E10), set `http: createHttp<Feature>Adapters` on its row (and `handlers` when the
 * feature's MSW handlers keep a seeded state: a factory building fresh handlers per test). Rows without `http`
 * are reported as `todo`.
 */
import type { CatalogPorts } from '@/application/catalog';
import type { AgentPorts } from '@/application/agents';
import { describeAgentsPortContract } from '@/application/ports/__contracts__/agents.contract';
import { describeArazzoPortContract, type ArazzoOwnPorts } from '@/application/ports/__contracts__/arazzo.contract';
import { describeCatalogPortContract } from '@/application/ports/__contracts__/catalog.contract';
import { describeCopilotPortContract, type CopilotOwnPorts } from '@/application/ports/__contracts__/copilot.contract';
import { describeGovernPortContract, type GovernOwnPorts } from '@/application/ports/__contracts__/govern.contract';
import { describeImportingPortContract, type ImportingOwnPorts } from '@/application/ports/__contracts__/importing.contract';
import { describeObservePortContract, type ObserveOwnPorts } from '@/application/ports/__contracts__/observe.contract';
import { describeTestingPortContract, type TestingOwnPorts } from '@/application/ports/__contracts__/testing.contract';
import { createHttpAgentsAdapters } from '@/infrastructure/http/agents';
import { createHttpArazzoAdapters } from '@/infrastructure/http/arazzo';
import { createHttpCatalogAdapters } from '@/infrastructure/http/catalog';
import { createHttpGovernAdapters } from '@/infrastructure/http/govern';
import { createHttpImportingAdapters } from '@/infrastructure/http/importing';
import { createHttpObserveAdapters } from '@/infrastructure/http/observe';
import { createAgentsHandlers } from '@/infrastructure/msw/handlers/agents';
import { createArazzoHandlers } from '@/infrastructure/msw/handlers/arazzo';
import { createCatalogHandlers } from '@/infrastructure/msw/handlers/catalog';
import { createObserveHandlers } from '@/infrastructure/msw/handlers/observe';
import { createHttpTestingAdapters } from '@/infrastructure/http/testing';
import { describePortContractOverHttp } from '@/infrastructure/msw/http.contract';
import { createGovernHandlers } from '@/infrastructure/msw/handlers/govern';
import { createImportingHandlers } from '@/infrastructure/msw/handlers/importing';
import { createTestingHandlers } from '@/infrastructure/msw/handlers/testing';

describePortContractOverHttp<CatalogPorts>({ feature: 'catalog', contract: describeCatalogPortContract, http: createHttpCatalogAdapters, handlers: createCatalogHandlers });
describePortContractOverHttp<CopilotOwnPorts>({ feature: 'copilot', contract: describeCopilotPortContract, http: undefined });
describePortContractOverHttp<ImportingOwnPorts>({ feature: 'importing', contract: describeImportingPortContract, http: createHttpImportingAdapters, handlers: createImportingHandlers });
describePortContractOverHttp<TestingOwnPorts>({ feature: 'testing', contract: describeTestingPortContract, http: createHttpTestingAdapters, handlers: createTestingHandlers });
describePortContractOverHttp<ArazzoOwnPorts>({ feature: 'arazzo', contract: describeArazzoPortContract, http: createHttpArazzoAdapters, handlers: createArazzoHandlers });
describePortContractOverHttp<ObserveOwnPorts>({ feature: 'observe', contract: describeObservePortContract, http: createHttpObserveAdapters, handlers: createObserveHandlers });
describePortContractOverHttp<GovernOwnPorts>({ feature: 'govern', contract: describeGovernPortContract, http: createHttpGovernAdapters, handlers: createGovernHandlers });
describePortContractOverHttp<AgentPorts>({ feature: 'agents', contract: describeAgentsPortContract, http: createHttpAgentsAdapters, handlers: createAgentsHandlers });
