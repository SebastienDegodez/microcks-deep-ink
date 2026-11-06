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
import { describePortContractOverHttp } from '@/infrastructure/msw/http.contract';

describePortContractOverHttp<CatalogPorts>({ feature: 'catalog', contract: describeCatalogPortContract, http: undefined });
describePortContractOverHttp<CopilotOwnPorts>({ feature: 'copilot', contract: describeCopilotPortContract, http: undefined });
describePortContractOverHttp<ImportingOwnPorts>({ feature: 'importing', contract: describeImportingPortContract, http: undefined });
describePortContractOverHttp<TestingOwnPorts>({ feature: 'testing', contract: describeTestingPortContract, http: undefined });
describePortContractOverHttp<ArazzoOwnPorts>({ feature: 'arazzo', contract: describeArazzoPortContract, http: undefined });
describePortContractOverHttp<ObserveOwnPorts>({ feature: 'observe', contract: describeObservePortContract, http: undefined });
describePortContractOverHttp<GovernOwnPorts>({ feature: 'govern', contract: describeGovernPortContract, http: undefined });
describePortContractOverHttp<AgentPorts>({ feature: 'agents', contract: describeAgentsPortContract, http: undefined });
