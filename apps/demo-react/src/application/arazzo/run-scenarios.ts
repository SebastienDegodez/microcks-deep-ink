import { DEFAULT_RUN_TIMEOUT_MS, EXAMPLE_BASE_URL } from '@/domain/arazzo';

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
 */
export const RUN_SCENARIOS: Record<RunScenario, { label: string; runNumber: number; defaults: RunFormDefaults }> = {
  impl14: {
    label: 'Implementations #14',
    runNumber: 14,
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
