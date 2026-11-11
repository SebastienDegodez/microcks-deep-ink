import { DEFAULT_RUN_TIMEOUT_MS, EXAMPLE_BASE_URL, type Workflow } from '../../domain/arazzo/index.js';

export type RunScenario = 'impl14' | 'mocksEnd' | 'mocksMissing';

/** Initial values of the "Run a workflow" form (strings as typed). */
export interface RunFormDefaults {
  target: 'mocks' | 'implementations' | 'mixed';
  baseUrls: Record<string, string>;
  perSource: Record<string, 'mock' | 'implementation'>;
  secret: string;
  /** Recorded example to play; `''` plus `detached` means manual inputs. */
  example: string;
  detached: boolean;
  inputs: Record<string, string>;
  validateSchemas: boolean;
  timeoutMs: string;
}

/**
 * The three prototype scenarios, selectable with `?scenario=`:
 * - impl14: implementations (staging), schema validation on, run #14 (fails at patchPastry);
 * - mocksEnd: mocks, example `already-available`, run #15 (ends early at getPastry);
 * - mocksMissing: mocks, no example, size S, run #16 (missing example for Tarte Tatin).
 * Each keeps the id of its run, so the run page links the three of them (the reviewer "Scenario" bar).
 */
export const RUN_SCENARIOS: Record<RunScenario, { label: string; runNumber: number; runId: string; defaults: RunFormDefaults }> = {
  impl14: {
    label: 'Implementations #14',
    runNumber: 14,
    runId: '6729a1d27e4c0b5f93a8c214',
    defaults: {
      target: 'implementations',
      baseUrls: { apiPastry: EXAMPLE_BASE_URL },
      perSource: { apiPastry: 'implementation' },
      secret: 'pastry-staging-oauth',
      example: 'restock-eclair',
      detached: false,
      inputs: { size: 'M', newPrice: '3.9' },
      validateSchemas: true,
      timeoutMs: String(DEFAULT_RUN_TIMEOUT_MS),
    },
  },
  mocksEnd: {
    label: 'Mocks · ended early',
    runNumber: 15,
    runId: '6729a3f08b1d6e2c45f7a930',
    defaults: {
      target: 'mocks',
      baseUrls: { apiPastry: EXAMPLE_BASE_URL },
      perSource: { apiPastry: 'mock' },
      secret: '',
      example: 'already-available',
      detached: false,
      inputs: { size: 'L', newPrice: '' },
      validateSchemas: false,
      timeoutMs: String(DEFAULT_RUN_TIMEOUT_MS),
    },
  },
  mocksMissing: {
    label: 'Mocks · missing example',
    runNumber: 16,
    runId: '6729a4b15c9e7d3a28b0f6e1',
    defaults: {
      target: 'mocks',
      baseUrls: { apiPastry: EXAMPLE_BASE_URL },
      perSource: { apiPastry: 'mock' },
      secret: '',
      example: '',
      detached: true,
      inputs: { size: 'S', newPrice: '4.2' },
      validateSchemas: false,
      timeoutMs: String(DEFAULT_RUN_TIMEOUT_MS),
    },
  },
};

export function isRunScenario(value: string | null | undefined): value is RunScenario {
  return value === 'impl14' || value === 'mocksEnd' || value === 'mocksMissing';
}

const SAMPLE_INPUTS: Record<string, string> = { name: 'Eclair Cafe', quantity: '2', beerName: 'Pilsner' };

function baseUrlOf(sourceName: string): string {
  if (sourceName === 'apiPastry') return EXAMPLE_BASE_URL;
  if (sourceName === 'apiPastryV1') return EXAMPLE_BASE_URL.replace(/\/v2$/, '/v1');
  return '';
}

/**
 * Initial values of the run form for a workflow. `restock-pastry` follows the prototype scenario
 * (`impl14` unless another one is asked for); any other workflow starts on the mocks, with one base URL
 * per source it uses, sample inputs and schema validation on.
 */
export function defaultsFor(workflow: Pick<Workflow, 'workflowId' | 'steps' | 'inputs'>, scenario?: RunScenario): RunFormDefaults {
  if (workflow.workflowId === 'restock-pastry') return RUN_SCENARIOS[scenario ?? 'impl14'].defaults;
  const sources = [...new Set(workflow.steps.map((s) => s.sourceName))];
  return {
    target: 'mocks',
    baseUrls: Object.fromEntries(sources.map((s) => [s, baseUrlOf(s)])),
    perSource: Object.fromEntries(sources.map((s) => [s, 'mock' as const])),
    secret: '',
    example: '',
    detached: true,
    inputs: Object.fromEntries(workflow.inputs.map((i) => [i.name, i.example ?? SAMPLE_INPUTS[i.name] ?? ''])),
    validateSchemas: true,
    timeoutMs: String(DEFAULT_RUN_TIMEOUT_MS),
  };
}
