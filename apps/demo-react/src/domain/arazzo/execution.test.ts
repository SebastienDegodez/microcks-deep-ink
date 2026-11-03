import { describe, expect, it } from 'vitest';
import { evaluateCriterion } from './expression';
import { executionLayers, nextAfterStep, playWorkflow, type Responder } from './execution';
import { END_IF_AVAILABLE, RETRY_PATCH, makeStep, restockSteps } from './test-helpers';

describe('executionLayers', () => {
  it('check-menu: three parallel roots, then compareSizes', () => {
    const steps = [
      makeStep('listSmall'),
      makeStep('listMedium'),
      makeStep('listLarge'),
      makeStep('compareSizes', { dependsOn: ['listSmall', 'listMedium', 'listLarge'] }),
    ];
    expect(executionLayers(steps)).toEqual([['listSmall', 'listMedium', 'listLarge'], ['compareSizes']]);
  });

  it('is sequential when no step declares dependsOn', () => {
    expect(executionLayers(restockSteps())).toEqual([['listPastries'], ['getPastry'], ['patchPastry'], ['verifyPastry']]);
  });

  it('uses the longest path as the layer', () => {
    const steps = [makeStep('a'), makeStep('b', { dependsOn: ['a'] }), makeStep('c', { dependsOn: ['a', 'b'] })];
    expect(executionLayers(steps)).toEqual([['a'], ['b'], ['c']]);
  });

  it('rejects unknown dependencies and cycles', () => {
    expect(() => executionLayers([makeStep('a', { dependsOn: ['zzz'] })])).toThrow(/Unknown step/);
    expect(() => executionLayers([makeStep('a', { dependsOn: ['b'] }), makeStep('b', { dependsOn: ['a'] })])).toThrow(/Cycle/);
  });
});

describe('evaluateCriterion', () => {
  it('evaluates simple conditions', () => {
    expect(evaluateCriterion({ type: 'simple', condition: '$statusCode == 200' }, { statusCode: 200 }).held).toBe(true);
    expect(evaluateCriterion({ type: 'simple', condition: '$statusCode != 200' }, { statusCode: 200 }).held).toBe(false);
    expect(evaluateCriterion({ type: 'simple', condition: '$statusCode < 300' }, { statusCode: 200 }).held).toBe(true);
    expect(evaluateCriterion({ type: 'simple', condition: '$statusCode > 300' }, { statusCode: 200 }).held).toBe(false);
  });

  it('reads the response body with JSON pointers', () => {
    const ctx = { statusCode: 200, body: { status: 'available' } };
    const result = evaluateCriterion({ type: 'simple', condition: "$response.body#/status == 'available'" }, ctx);
    expect(result.held).toBe(true);
    expect(result.evaluation).toBe('$response.body#/status = "available"');
  });

  it('evaluates regex criteria on their context', () => {
    const criterion = { type: 'regex', context: '$response.body#/status', condition: '^available$' } as const;
    expect(evaluateCriterion(criterion, { body: { status: 'available' } }).held).toBe(true);
    expect(evaluateCriterion(criterion, { body: { status: 'unknown' } }).held).toBe(false);
  });

  it('does not hold when the expression cannot be resolved', () => {
    expect(evaluateCriterion({ type: 'simple', condition: '$response.body#/missing == 1' }, { body: {} }).held).toBe(false);
  });
});

describe('nextAfterStep', () => {
  const patch = { onSuccess: [], onFailure: [RETRY_PATCH] };

  it('retries a failed step until retryLimit retries have been made', () => {
    expect(nextAfterStep(patch, { passed: false, attempt: 1 })).toEqual({ kind: 'retry', actionName: 'retryPatch', afterSeconds: 1, nextAttempt: 2 });
    expect(nextAfterStep(patch, { passed: false, attempt: 2 })).toMatchObject({ kind: 'retry', nextAttempt: 3 });
    expect(nextAfterStep(patch, { passed: false, attempt: 3 })).toEqual({
      kind: 'end', outcome: 'failure', reason: 'retry-limit-reached', actionName: 'retryPatch',
    });
  });

  it('ends the run on failure when no action is declared', () => {
    expect(nextAfterStep({ onSuccess: [], onFailure: [] }, { passed: false, attempt: 1 })).toEqual({
      kind: 'end', outcome: 'failure', reason: 'no-failure-action',
    });
  });

  it('applies an end action only when its criteria hold', () => {
    const get = { onSuccess: [END_IF_AVAILABLE], onFailure: [] };
    expect(nextAfterStep(get, { passed: true, attempt: 1, context: { body: { status: 'available' } } })).toMatchObject({
      kind: 'end', outcome: 'success', actionName: 'alreadyAvailable',
    });
    expect(nextAfterStep(get, { passed: true, attempt: 1, context: { body: { status: 'unknown' } } })).toEqual({ kind: 'next' });
  });
});

describe('playWorkflow: run #14 (implementations, schema validation on)', () => {
  const respond: Responder = (step, attempt) => {
    switch (step.stepId) {
      case 'listPastries':
        return { statusCode: 200, body: [{ name: 'Eclair Cafe' }], ms: 41, schema: 'pass' };
      case 'getPastry':
        return { statusCode: 200, body: { name: 'Eclair Cafe', price: 2.4, status: 'unknown' }, ms: 29, schema: 'pass' };
      case 'patchPastry':
        // The bug: price comes back as the STRING "3.9"; the criteria hold, the schema does not.
        return { statusCode: 200, body: { name: 'Eclair Cafe', price: '3.9', status: 'available' }, ms: 60 + attempt, schema: 'fail' };
      default:
        throw new Error(`verifyPastry must not run (${step.stepId})`);
    }
  };

  it('fails at patchPastry after 3 attempts and does not run verifyPastry', () => {
    const run = playWorkflow({ steps: restockSteps(), outputs: [] }, respond, { inputs: { size: 'M', newPrice: 3.9 }, validateSchemas: true });
    expect(run.status).toBe('FAILURE');
    expect(run.stoppedAt).toBe('patchPastry');
    const patch = run.steps.find((s) => s.stepId === 'patchPastry');
    expect(patch?.status).toBe('failed');
    expect(patch?.attempts).toHaveLength(3);
    expect(patch?.attempts.every((a) => a.criteriaHeld && a.schema === 'fail' && !a.passed)).toBe(true);
    expect(run.steps.find((s) => s.stepId === 'verifyPastry')?.status).toBe('not-run');
    expect(run.steps.find((s) => s.stepId === 'getPastry')?.status).toBe('passed');
  });

  it('would pass patchPastry when schema validation is off (criteria alone hold)', () => {
    const lenient: Responder = (step, attempt, ctx) =>
      step.stepId === 'verifyPastry'
        ? { statusCode: 200, body: { status: 'available' }, ms: 5 }
        : respond(step, attempt, ctx);
    const run = playWorkflow({ steps: restockSteps(), outputs: [] }, lenient, { inputs: {}, validateSchemas: false });
    expect(run.status).toBe('SUCCESS');
    expect(run.steps.find((s) => s.stepId === 'patchPastry')?.attempts).toHaveLength(1);
  });
});

describe('playWorkflow: run #15 (mocks, ended early)', () => {
  it('ends with SUCCESS at getPastry because status == available', () => {
    const respond: Responder = (step) =>
      step.stepId === 'listPastries'
        ? { statusCode: 200, body: [{ name: 'Millefeuille' }], ms: 6 }
        : { statusCode: 200, body: { name: 'Millefeuille', price: 4.4, status: 'available' }, ms: 5 };
    const run = playWorkflow(
      { steps: restockSteps(), outputs: [{ name: 'pastryName', expression: '$steps.listPastries.outputs.firstName' }] },
      respond,
      { inputs: { size: 'L' }, validateSchemas: false },
    );
    expect(run.status).toBe('SUCCESS');
    expect(run.stoppedAt).toBe('getPastry');
    expect(run.steps.map((s) => s.status)).toEqual(['passed', 'passed', 'not-run', 'not-run']);
    expect(run.outputs).toEqual({ pastryName: 'Millefeuille' });
  });
});
