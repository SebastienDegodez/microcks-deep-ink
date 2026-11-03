import { describe, expect, it } from 'vitest';
import { runFrames } from './progress';
import { renderBody, simulateRun, type SimulatedResponder } from './simulation';
import { restockSteps } from './test-helpers';

const steps = restockSteps().map((s) =>
  s.stepId === 'getPastry' || s.stepId === 'verifyPastry'
    ? { ...s, path: '/pastries/{name}', parameters: [{ name: 'name', in: 'path' as const, value: '$steps.listPastries.outputs.firstName' }] }
    : s.stepId === 'patchPastry'
      ? { ...s, method: 'PATCH', path: '/pastries/{name}', requestBody: '{"price": "{$inputs.newPrice}", "status": "available"}', parameters: [{ name: 'name', in: 'path' as const, value: '$steps.listPastries.outputs.firstName' }] }
      : s,
);
const workflow = { workflowId: 'restock-pastry', documentId: 'pastry', steps, outputs: [{ name: 'newPrice', expression: '$steps.patchPastry.outputs.newPrice' }] };

const base = {
  runId: 'r1',
  number: 7,
  workflow,
  origin: { kind: 'ui' } as const,
  target: { kind: 'mocks' } as const,
  startedAt: '2026-11-03T09:10:04Z',
  baseUrl: () => 'http://mock',
};

const ok: SimulatedResponder = (step) => {
  switch (step.stepId) {
    case 'listPastries':
      return { statusCode: 200, body: [{ name: 'Eclair Cafe' }], ms: 5 };
    case 'getPastry':
      return { statusCode: 200, body: { price: 2.4, status: 'unknown' }, ms: 5 };
    case 'patchPastry':
      return { statusCode: 200, body: { price: 3.9 }, ms: 5, schema: 'pass' };
    default:
      return { statusCode: 200, body: { status: 'available' }, ms: 5 };
  }
};

describe('simulateRun', () => {
  it('passes when every step answers 200 and records outputs', () => {
    const run = simulateRun({ ...base, options: { inputs: { size: 'M', newPrice: 3.9 }, timeoutMs: 10_000, validateSchemas: false }, respond: ok });
    expect(run.status).toBe('SUCCESS');
    expect(run.steps.map((s) => s.status)).toEqual(['passed', 'passed', 'passed', 'passed']);
    expect(run.outputs).toEqual({ newPrice: 3.9 });
    expect(run.steps[0]?.request?.url).toBe('http://mock/pastries');
    expect(run.steps[1]?.request?.url).toBe('http://mock/pastries/Eclair%20Cafe');
    expect(run.steps[3]?.baggage).toBe('microcks-arazzo-run=r1,microcks-arazzo-workflow=restock-pastry,microcks-arazzo-step=verifyPastry,microcks-arazzo-attempt=1');
  });

  it('reproduces run #14: the schema breaks, retried twice, verifyPastry not run', () => {
    const bad: SimulatedResponder = (step, attempt, ctx) =>
      step.stepId === 'patchPastry'
        ? { statusCode: 200, body: { price: '3.9', status: 'available' }, ms: 60 + attempt, schema: 'fail', badKey: 'price', badNote: 'schema: number', schemaMessage: '/price is a string' }
        : ok(step, attempt, ctx);
    const run = simulateRun({ ...base, options: { inputs: { size: 'M', newPrice: 3.9 }, timeoutMs: 10_000, validateSchemas: true }, respond: bad });
    expect(run.status).toBe('FAILURE');
    expect(run.steps.map((s) => s.status)).toEqual(['passed', 'passed', 'failed', 'not-run']);
    const patch = run.steps[2];
    expect(patch?.attempts).toHaveLength(3);
    expect(patch?.attempts.map((a) => a.when)).toEqual(['first call', 'after 1 s', 'after 1 s']);
    expect(patch?.criteria[0]).toMatchObject({ held: true, evaluation: '$statusCode = 200' });
    expect(patch?.schema).toMatchObject({ state: 'fail', message: '/price is a string' });
    expect(patch?.response?.lines.find((l) => l.bad)).toMatchObject({ text: '  "price": "3.9",', note: 'schema: number' });
    expect(patch?.flow).toMatchObject({ kind: 'stop' });
    expect(patch?.request?.body).toBe('{"price": 3.9, "status": "available"}');
    expect(run.outputs).toEqual({});
    expect(run.steps[3]?.attempts).toEqual([]);
  });

  it('judges on the success criteria only when schema validation is off', () => {
    const bad: SimulatedResponder = (step, attempt, ctx) =>
      step.stepId === 'patchPastry' ? { statusCode: 200, body: { price: '3.9' }, ms: 60, schema: 'fail' } : ok(step, attempt, ctx);
    const run = simulateRun({ ...base, options: { inputs: { size: 'M', newPrice: 3.9 }, timeoutMs: 10_000, validateSchemas: false }, respond: bad });
    expect(run.status).toBe('SUCCESS');
    expect(run.steps[2]?.schema.state).toBe('off');
  });

  it('ends early when the onSuccess end criteria hold (run #15)', () => {
    const available: SimulatedResponder = (step, attempt, ctx) =>
      step.stepId === 'getPastry' ? { statusCode: 200, body: { price: 4.4, status: 'available' }, ms: 5 } : ok(step, attempt, ctx);
    const run = simulateRun({ ...base, options: { inputs: { size: 'L' }, timeoutMs: 10_000, validateSchemas: false }, respond: available });
    expect(run.status).toBe('SUCCESS');
    expect(run.steps.map((s) => s.status)).toEqual(['passed', 'passed', 'not-run', 'not-run']);
    expect(run.steps[1]?.flow).toMatchObject({ kind: 'end' });
  });

  it('names the missing example as a mock coherence issue (run #16)', () => {
    const missing: SimulatedResponder = (step, attempt, ctx) =>
      step.stepId === 'getPastry'
        ? { statusCode: 400, ms: 4, missingExample: { description: 'an example of GetPastryByName for name=Tarte Tatin', hint: 'Tarte Tatin' } }
        : ok(step, attempt, ctx);
    const run = simulateRun({ ...base, options: { inputs: { size: 'S' }, timeoutMs: 10_000, validateSchemas: false }, respond: missing });
    expect(run.status).toBe('FAILURE');
    expect(run.coherence).toEqual([{ stepId: 'getPastry', operationId: 'getPastry', missing: 'an example of GetPastryByName for name=Tarte Tatin', copilotHint: 'Tarte Tatin' }]);
    expect(run.steps[1]?.response?.meta).toBe('400 Bad Request');
    expect(run.steps[1]?.flow.title).toBe('No onFailure action: the run ends here');
  });
});

describe('renderBody', () => {
  it('replaces quoted expressions by JSON values', () => {
    expect(renderBody('{"price": "{$inputs.newPrice}", "tag": "{$inputs.tag}"}', { inputs: { newPrice: 3.9, tag: 'x' } })).toBe('{"price": 3.9, "tag": "x"}');
  });
});

describe('runFrames', () => {
  it('has one frame per attempt and ends with the final run', () => {
    const bad: SimulatedResponder = (step, attempt, ctx) =>
      step.stepId === 'patchPastry' ? { statusCode: 200, body: { price: '3.9' }, ms: 60, schema: 'fail' } : ok(step, attempt, ctx);
    const run = simulateRun({ ...base, options: { inputs: { size: 'M', newPrice: 3.9 }, timeoutMs: 10_000, validateSchemas: true }, respond: bad });
    const frames = runFrames(run);
    expect(frames.map((f) => f.current && `${f.current.stepId}#${f.current.attempt}`)).toEqual([
      'listPastries#1', 'getPastry#1', 'patchPastry#1', 'patchPastry#2', 'patchPastry#3', undefined,
    ]);
    expect(frames.slice(0, -1).every((f) => f.status === 'RUNNING')).toBe(true);
    expect(frames[frames.length - 1]).toBe(run);
    // while retrying, the step shows the attempts that already ended
    expect(frames[3]?.steps[2]?.attempts).toHaveLength(1);
    expect(frames[2]?.steps[2]?.attempts).toHaveLength(0);
  });
});
