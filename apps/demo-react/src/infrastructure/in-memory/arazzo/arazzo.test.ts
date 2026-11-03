import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkflowRun } from '@/domain/arazzo';
import { createArazzoUseCases, type ArazzoUseCases } from '@/application/arazzo';
import { NotFoundError, ValidationError } from '@/application/shared';
import type { SecretRepository } from '@/application/ports/importing';
import { RUN_IDS, setLatencyMode } from '../shared';
import { createInMemoryArazzoAdapters } from './index';
import { canonicalRunId } from './runner';

const secrets: SecretRepository = {
  list: async () => [],
  create: async () => {
    throw new Error('not used');
  },
  remove: async () => undefined,
};

function setup(): ArazzoUseCases {
  setLatencyMode('fast');
  return createArazzoUseCases({ ...createInMemoryArazzoAdapters(), secrets });
}

afterEach(() => {
  vi.useRealTimers();
  setLatencyMode(undefined);
});

const form = (over: Partial<Parameters<ArazzoUseCases['startRun']>[0]> = {}) => ({
  documentId: 'pastry',
  workflowId: 'restock-pastry',
  target: 'mocks' as const,
  baseUrls: {},
  inputs: { size: 'M', newPrice: '3.9' },
  validateSchemas: false,
  timeoutMs: 10_000,
  ...over,
});

/** Collects the frames of a run until the final one. */
async function watch(uc: ArazzoUseCases, runId: string): Promise<WorkflowRun[]> {
  return new Promise((resolve) => {
    const frames: WorkflowRun[] = [];
    const off = uc.watchRun(runId, (run) => {
      frames.push(run);
      if (run.status !== 'RUNNING') {
        off();
        resolve(frames);
      }
    });
  });
}

describe('runner: the story of run #14', () => {
  it('replays the seeded run #14 for the staging scenario, with the same bug', async () => {
    const uc = setup();
    const { runId } = await uc.startRun(
      form({ target: 'implementations', baseUrls: { apiPastry: 'https://pastry.staging.acme.io/v2' }, example: 'restock-eclair', validateSchemas: true, secret: 'pastry-staging-oauth' }),
    );
    expect(runId).toBe(RUN_IDS[14]);
    const run = await uc.getRun(runId);
    expect(run).toMatchObject({ number: 14, status: 'FAILURE', relatedTestRunId: '119' });
    expect(run.steps.map((s) => s.status)).toEqual(['passed', 'passed', 'failed', 'not-run']);
  });

  it('simulates the same failure for a staging run that is not one of the scenarios (new run, new number)', async () => {
    const uc = setup();
    const { runId } = await uc.startRun(
      form({ target: 'implementations', baseUrls: { apiPastry: 'https://pastry.staging.acme.io/v2' }, inputs: { size: 'M', newPrice: '4.2' }, validateSchemas: true }),
    );
    expect(runId).not.toBe(RUN_IDS[14]);
    const run = await uc.getRun(runId);
    expect(run.number).toBe(17);
    expect(run.status).toBe('FAILURE');
    const patch = run.steps[2];
    expect(patch?.attempts.map((a) => [a.n, a.httpStatus, a.ms])).toEqual([[1, 200, 66], [2, 200, 58], [3, 200, 61]]);
    expect(patch?.criteria[0]).toMatchObject({ held: true });
    expect(patch?.schema.state).toBe('fail');
    expect(patch?.response?.lines.find((l) => l.bad)?.text).toBe('  "price": "4.2",');
    expect(run.steps[3]?.status).toBe('not-run');
    expect(run.relatedTestRunId).toBe('119');
    expect((await uc.listRuns('pastry', 'restock-pastry'))[0]?.id).toBe(runId);
  });

  it('passes on staging when schema validation is off (criteria alone hold)', async () => {
    const uc = setup();
    const { runId } = await uc.startRun(form({ target: 'implementations', baseUrls: { apiPastry: 'https://pastry.staging.acme.io/v2' }, validateSchemas: false }));
    const run = await uc.getRun(runId);
    expect(run.status).toBe('SUCCESS');
    expect(run.steps[2]?.schema.state).toBe('off');
  });

  it('plays the mocks to the end, ends early on an available pastry and names a missing example', async () => {
    const uc = setup();
    const ok = await uc.getRun((await uc.startRun(form({ example: 'restock-eclair' }))).runId);
    expect(ok).toMatchObject({ status: 'SUCCESS', outputs: { pastryName: 'Eclair Cafe', oldPrice: 2.4, newPrice: 3.9 } });

    const early = await uc.getRun((await uc.startRun(form({ example: 'already-available', inputs: { size: 'L', newPrice: '' } }))).runId);
    expect(early.number).toBe(15);
    expect(early.steps.map((s) => s.status)).toEqual(['passed', 'passed', 'not-run', 'not-run']);

    const missing = await uc.getRun((await uc.startRun(form({ inputs: { size: 'S', newPrice: '4.2' } }))).runId);
    expect(missing.number).toBe(16);
    expect(missing.coherence[0]).toMatchObject({ missing: 'an example of GetPastryByName for name=Tarte Tatin', copilotHint: 'Tarte Tatin' });
  });

  it('plays check-menu as parallel branches that join at compareSizes', async () => {
    const uc = setup();
    const run = await uc.getRun((await uc.startRun(form({ workflowId: 'check-menu', inputs: {} }))).runId);
    expect(run.steps.map((s) => [s.stepId, s.status])).toEqual([
      ['listSmall', 'passed'], ['listMedium', 'passed'], ['listLarge', 'passed'], ['compareSizes', 'passed'],
    ]);
  });

  it('refuses a workflow that cannot run, and an unknown one', async () => {
    const uc = setup();
    await expect(uc.startRun(form({ workflowId: 'order-pastry', inputs: {} }))).rejects.toBeInstanceOf(ValidationError);
    await expect(uc.startRun(form({ workflowId: 'nope' }))).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('runner: live progress', () => {
  it('emits one frame per attempt then the final run, step by step (run #14: 6 frames)', async () => {
    const uc = setup();
    const frames = await watch(uc, RUN_IDS[14]);
    expect(frames.map((f) => (f.current ? `${f.current.stepId}#${f.current.attempt}` : 'done'))).toEqual([
      'listPastries#1', 'getPastry#1', 'patchPastry#1', 'patchPastry#2', 'patchPastry#3', 'done',
    ]);
    expect(frames.at(-1)?.status).toBe('FAILURE');
  });

  it('ticks every 1200 ms outside fast mode', async () => {
    vi.useFakeTimers();
    setLatencyMode('normal');
    const adapters = createInMemoryArazzoAdapters();
    const seen: string[] = [];
    const off = adapters.runner.watch(RUN_IDS[12])((run) => seen.push(run.current?.stepId ?? run.status));
    expect(seen).toEqual(['listPastries']);
    await vi.advanceTimersByTimeAsync(1199);
    expect(seen).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(seen).toEqual(['listPastries', 'getPastry']);
    await vi.advanceTimersByTimeAsync(3600);
    expect(seen.at(-1)).toBe('SUCCESS');
    off();
  });

  it('emits nothing for an unknown run', async () => {
    const adapters = createInMemoryArazzoAdapters();
    const seen: unknown[] = [];
    adapters.runner.watch('nope')((run) => seen.push(run));
    expect(seen).toEqual([]);
  });
});

describe('canonicalRunId', () => {
  it('only recognises the seeded scenarios', () => {
    const base = { documentId: 'pastry', workflowId: 'restock-pastry', origin: { kind: 'ui' as const } };
    expect(canonicalRunId({ ...base, target: { kind: 'mocks' }, options: { example: 'already-available', inputs: { size: 'L' }, timeoutMs: 1, validateSchemas: false } })).toBe(RUN_IDS[15]);
    expect(canonicalRunId({ ...base, target: { kind: 'mocks' }, options: { inputs: { size: 'M' }, timeoutMs: 1, validateSchemas: false } })).toBeUndefined();
  });
});

describe('sessions and documents', () => {
  it('opens a session, then fails its verification: no call was received', async () => {
    const uc = setup();
    const session = await uc.openSession({ documentId: 'pastry', workflowId: 'restock-pastry', app: 'checkout-web', inputs: { size: 'M', newPrice: 3.9 } });
    expect(session).toMatchObject({ state: 'open', calls: [] });
    const verified = await uc.verifySession(session.id);
    expect(verified.state).toBe('closed');
    expect(verified.verification?.result).toBe('FAILURE');
    expect(verified.verification?.problems[0]).toEqual({ lead: 'Step 1, listPastries:', text: 'no call received for this step' });
    const runs = await uc.listRuns('pastry', 'restock-pastry', 'session');
    expect(runs[0]).toMatchObject({ number: 17, status: 'FAILURE', origin: { kind: 'session', sessionId: session.id } });
  });

  it('verifies the open compensation session: the failing step was never called', async () => {
    const uc = setup();
    const verified = await uc.verifySession('s-2b91e04d');
    expect(verified.verification?.problems).toEqual([{ lead: 'Step 3, patchPastry:', text: 'no call received for this step' }]);
  });

  it('serves the overlay of the pastry document only', async () => {
    const uc = setup();
    expect(await uc.getDocumentOverlay('pastry')).toContain('kind: ArazzoSources');
    expect(await uc.getDocumentOverlay('beer')).toBeUndefined();
  });

  it('links beerCatalog and unblocks checkout-beer', async () => {
    const uc = setup();
    const doc = await uc.linkSource('beer', 'beerCatalog', 'beer');
    expect(doc.sources[0]?.link).toMatchObject({ status: 'linked', serviceId: 'beer', protocol: 'REST' });
    expect((await uc.getWorkflow('beer', 'checkout-beer')).workflow.runnability.runnable).toBe(true);
    await expect(uc.linkSource('beer', 'nope', 'beer')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('builds run form defaults per workflow', async () => {
    const uc = setup();
    const impl = await uc.getRunSetup('pastry', 'restock-pastry', 'mocksEnd');
    expect(impl.defaults).toMatchObject({ target: 'mocks', example: 'already-available' });
    const other = await uc.getRunSetup('pastry', 'compare-prices');
    expect(other.defaults).toMatchObject({ target: 'mocks', detached: true, validateSchemas: true, inputs: { name: 'Eclair Cafe' } });
    expect(Object.keys(other.defaults.baseUrls)).toEqual(['apiPastryV1', 'apiPastry']);
  });
});
