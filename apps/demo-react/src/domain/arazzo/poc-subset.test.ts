import { describe, expect, it } from 'vitest';
import { validatePocSubset } from '@microcks/demo-core/domain/arazzo/poc-subset';

const doc = (workflow: Record<string, unknown>) => ({ arazzo: '1.1.0', workflows: [{ workflowId: 'w', steps: [], ...workflow }] });
const withStep = (step: Record<string, unknown>) => doc({ steps: [{ stepId: 's', operationId: 'op', ...step }] });

describe('validatePocSubset', () => {
  it('accepts a document inside the subset (retry, end, simple and regex criteria)', () => {
    const ok = withStep({
      successCriteria: [{ condition: '$statusCode == 200' }, { type: 'regex', context: '$response.body#/status', condition: '^a$' }],
      onSuccess: [{ type: 'end', name: 'e' }],
      onFailure: [{ type: 'retry', name: 'r', retryAfter: 1, retryLimit: 2 }],
      parameters: [{ name: 'size', in: 'query', value: 'M' }],
    });
    expect(validatePocSubset(ok)).toEqual([]);
  });

  it('refuses goto', () => {
    const issues = validatePocSubset(withStep({ onFailure: [{ type: 'goto', name: 'g', stepId: 'other' }] }));
    expect(issues.map((i) => i.code)).toEqual(['goto']);
    expect(issues[0]?.path).toBe('workflows[0].steps[0].onFailure[0]');
  });

  it('refuses jsonpath and xpath criteria (string or object type)', () => {
    const issues = validatePocSubset(
      withStep({
        successCriteria: [
          { type: 'jsonpath', context: '$response.body', condition: '$[0]' },
          { type: { type: 'xpath', version: 'xpath-30' }, context: '$response.body', condition: '//a' },
        ],
      }),
    );
    expect(issues.map((i) => i.code)).toEqual(['jsonpath-criteria', 'xpath-criteria']);
  });

  it('refuses steps by workflowId and by operationPath', () => {
    expect(validatePocSubset(doc({ steps: [{ stepId: 's', workflowId: 'other' }] })).map((i) => i.code)).toEqual(['workflow-id-step']);
    expect(validatePocSubset(doc({ steps: [{ stepId: 's', operationPath: '{$sourceDescriptions.a.url}#/paths/~1x/get' }] })).map((i) => i.code)).toEqual([
      'operation-path-step',
    ]);
  });

  it('refuses workflow-level dependsOn, successActions and failureActions', () => {
    const codes = validatePocSubset(doc({ dependsOn: ['x'], successActions: [{ type: 'end', name: 'e' }], failureActions: [{ type: 'end', name: 'f' }] })).map(
      (i) => i.code,
    );
    expect(codes).toEqual(['workflow-depends-on', 'workflow-success-actions', 'workflow-failure-actions']);
  });

  it('refuses actions taken from $components', () => {
    const issues = validatePocSubset(withStep({ onFailure: [{ reference: '$components.failureActions.retry' }] }));
    expect(issues.map((i) => i.code)).toEqual(['components-action']);
  });

  it('refuses cookie parameters', () => {
    const issues = validatePocSubset(withStep({ parameters: [{ name: 'sid', in: 'cookie', value: 'x' }] }));
    expect(issues.map((i) => i.code)).toEqual(['cookie-parameter']);
  });

  it('ignores anything that is not an object', () => {
    expect(validatePocSubset(null)).toEqual([]);
    expect(validatePocSubset('arazzo')).toEqual([]);
  });
});
