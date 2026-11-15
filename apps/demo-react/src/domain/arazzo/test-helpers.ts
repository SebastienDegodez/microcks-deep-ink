import type { Action, Criterion, Step } from '@microcks/demo-core/domain/arazzo/workflow';

/** Compact step builder shared by the domain tests (not exported from the domain barrel). */
export function makeStep(
  stepId: string,
  extra: Partial<Pick<Step, 'dependsOn' | 'onSuccess' | 'onFailure' | 'successCriteria' | 'outputs'>> = {},
): Step {
  const ok: Criterion[] = [{ type: 'simple', condition: '$statusCode == 200' }];
  return {
    stepId, sourceName: 'apiPastry', operationId: stepId, method: 'GET', path: '/pastries', description: '',
    parameters: [], successCriteria: ok, onSuccess: [], onFailure: [], outputs: [], ...extra,
  };
}

export const RETRY_PATCH: Action = { type: 'retry', name: 'retryPatch', retryAfter: 1, retryLimit: 2 };
export const END_IF_AVAILABLE: Action = {
  type: 'end', name: 'alreadyAvailable', criteria: [{ type: 'simple', condition: "$response.body#/status == 'available'" }],
};

/** restock-pastry, reduced to what the run semantics need. */
export function restockSteps(): Step[] {
  return [
    makeStep('listPastries', { outputs: [{ name: 'firstName', expression: '$response.body#/0/name' }] }),
    makeStep('getPastry', { onSuccess: [END_IF_AVAILABLE], outputs: [{ name: 'status', expression: '$response.body#/status' }] }),
    makeStep('patchPastry', { onFailure: [RETRY_PATCH], outputs: [{ name: 'newPrice', expression: '$response.body#/price' }] }),
    makeStep('verifyPastry', {
      successCriteria: [
        { type: 'simple', condition: '$statusCode == 200' },
        { type: 'simple', condition: "$response.body#/status == 'available'" },
        { type: 'regex', context: '$response.body#/status', condition: '^available$' },
      ],
    }),
  ];
}
