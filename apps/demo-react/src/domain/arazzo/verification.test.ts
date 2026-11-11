import { describe, expect, it } from 'vitest';
import { restockSteps } from './test-helpers';
import type { Session, SessionCall } from '@microcks/demo-core/domain/arazzo/session';
import { verificationRun, verifySession } from '@microcks/demo-core/domain/arazzo/verification';

const call = (n: number, stepId: string, extra: Partial<SessionCall> = {}): SessionCall => ({
  n, method: 'GET', path: '/pastries', httpStatus: 200, stepId,
  contract: { state: 'pass', text: 'conforms' }, dataPassing: { state: 'pass', text: 'ok' }, ...extra,
});
const workflow = { workflowId: 'restock-pastry', documentId: 'pastry', steps: restockSteps() };
const session = (calls: SessionCall[], failureInjection?: Session['failureInjection']): Session => ({
  id: 's-1', app: 'checkout-web', documentId: 'pastry', workflowId: 'restock-pastry', state: 'open', openedAt: '2026-11-03T09:10:04Z',
  inputs: { size: 'M' }, calls, failureInjection,
});

describe('verifySession', () => {
  it('succeeds when every step is called in a clean way', () => {
    const v = verifySession(session(['listPastries', 'getPastry', 'patchPastry', 'verifyPastry'].map((s, i) => call(i + 1, s))), workflow);
    expect(v.result).toBe('SUCCESS');
    expect(v.problems).toEqual([]);
  });

  it('reports data not passed, unexpected calls and contract violations', () => {
    const v = verifySession(
      session([
        call(1, 'listPastries'),
        call(2, 'getPastry'),
        call(3, 'unexpected', { httpStatus: 400, contract: { state: 'fail', text: 'size XL is not one of S, M, L' } }),
        call(4, 'patchPastry', { dataPassing: { state: 'fail', text: 'name=Millefeuille, expected Eclair Cafe' } }),
        call(5, 'verifyPastry'),
      ]),
      workflow,
    );
    expect(v.result).toBe('FAILURE');
    expect(v.problems.map((p) => p.lead)).toEqual(['Step 3, patchPastry:', 'Call #3, GET /pastries:']);
    expect(v.steps.patchPastry).toBe('failed');
  });

  it('expects no step after the injected failure, but expects the failing step itself', () => {
    const early = verifySession(session([call(1, 'listPastries'), call(2, 'getPastry')], { stepId: 'patchPastry', example: 'out of stock' }), workflow);
    expect(early.problems).toEqual([{ lead: 'Step 3, patchPastry:', text: 'no call received for this step' }]);
    const compensated = verifySession(
      session([call(1, 'listPastries'), call(2, 'getPastry'), call(3, 'patchPastry', { httpStatus: 409 })], { stepId: 'patchPastry', example: 'out of stock' }),
      workflow,
    );
    expect(compensated.result).toBe('SUCCESS');
  });

  it('builds the verification run with the origin session', () => {
    const s = session([call(1, 'listPastries')]);
    const v = verifySession(s, workflow);
    const run = verificationRun(s, workflow, v, { runId: 'r9', number: 17, baseUrl: 'http://mock', startedAt: '2026-11-03T09:10:04Z' });
    expect(run.origin).toEqual({ kind: 'session', sessionId: 's-1', app: 'checkout-web' });
    expect(run.status).toBe('FAILURE');
    expect(run.steps.map((x) => x.status)).toEqual(['passed', 'not-run', 'not-run', 'not-run']);
  });
});
