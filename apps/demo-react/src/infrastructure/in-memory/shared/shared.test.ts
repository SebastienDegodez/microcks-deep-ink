import { afterEach, describe, expect, it, vi } from 'vitest';
import { playWorkflow, type Responder } from '@microcks/demo-core/domain/arazzo';
import { FixedClock } from '@microcks/demo-core/infrastructure/in-memory/shared/clock';
import { isFastMode, latency, nextLatencyMs, setLatencyMode } from '@microcks/demo-core/infrastructure/in-memory/shared/latency';
import { RUN_IDS, SERVICE_IDS } from '@microcks/demo-core/infrastructure/in-memory/shared/seed-ids';
import { DOCUMENTS, RESTOCK_STEPS, WORKFLOWS, seedRuns, seedSessions } from '@microcks/demo-core/infrastructure/in-memory/shared/arazzo.seed';
import { SERVICES, OPERATIONS, PASTRY2_EXAMPLES } from '@microcks/demo-core/infrastructure/in-memory/shared/services.seed';
import { createSequenceStream, createStream, createTickingStream, TICK_MS } from '@microcks/demo-core/infrastructure/in-memory/shared/stream';

afterEach(() => {
  vi.useRealTimers();
  setLatencyMode(undefined);
});

describe('seeds', () => {
  it('has the 10 services of the Catalogue prototype, in order', () => {
    expect(SERVICES.map((s) => s.id)).toEqual([...SERVICE_IDS]);
    expect(SERVICES.every((s) => OPERATIONS[s.id]?.length === s.operationCount)).toBe(true);
  });

  it('gives API Pastry 2.0 seven human examples and one pending AI example', () => {
    const all = Object.values(PASTRY2_EXAMPLES).flat();
    expect(all.filter((e) => !e.aiGenerated)).toHaveLength(7);
    expect(all.filter((e) => e.aiGenerated && e.reviewState === 'pending').map((e) => e.name)).toEqual(['Tartelette Framboise']);
  });

  it('defines arazzo 1.1.0 for pastry and 1.0.1 for beer, with beerCatalog not linked', () => {
    expect(DOCUMENTS.map((d) => [d.id, d.arazzoVersion])).toEqual([['pastry', '1.1.0'], ['beer', '1.0.1']]);
    expect(DOCUMENTS[1]?.sources[0]?.link.status).toBe('not-linked');
    expect(WORKFLOWS.map((w) => w.workflowId)).toEqual(['restock-pastry', 'order-pastry', 'compare-prices', 'check-menu', 'checkout-beer']);
  });

  it('marks order-pastry as not runnable because of its AsyncAPI steps', () => {
    const w = WORKFLOWS.find((x) => x.workflowId === 'order-pastry');
    expect(w?.runnability).toMatchObject({ runnable: false, reason: 'asyncapi-steps' });
  });

  it('seeds run #14 as the schema-validation failure at patchPastry (3 attempts, verifyPastry not run)', () => {
    const run = seedRuns().find((r) => r.number === 14 && r.workflowId === 'restock-pastry');
    expect(run?.id).toBe(RUN_IDS[14]);
    expect(run?.status).toBe('FAILURE');
    expect(run?.target.kind).toBe('implementations');
    expect(run?.options.validateSchemas).toBe(true);
    expect(run?.relatedTestRunId).toBe('119');
    const patch = run?.steps.find((s) => s.stepId === 'patchPastry');
    expect(patch?.attempts.map((a) => a.ms)).toEqual([66, 58, 61]);
    expect(patch?.schema.state).toBe('fail');
    expect(patch?.criteria.every((c) => c.held)).toBe(true);
    expect(patch?.response?.lines.find((l) => l.bad)?.text).toContain('"3.9"');
    expect(run?.steps.find((s) => s.stepId === 'verifyPastry')?.status).toBe('not-run');
  });

  it('replaying the seeded workflow reproduces the seeded run #14', () => {
    const respond: Responder = (step, attempt) =>
      step.stepId === 'listPastries'
        ? { statusCode: 200, body: [{ name: 'Eclair Cafe' }], ms: 41, schema: 'pass' }
        : step.stepId === 'getPastry'
          ? { statusCode: 200, body: { status: 'unknown', price: 2.4 }, ms: 29, schema: 'pass' }
          : { statusCode: 200, body: { price: '3.9' }, ms: 60 + attempt, schema: 'fail' };
    const played = playWorkflow({ steps: RESTOCK_STEPS, outputs: [] }, respond, { inputs: { size: 'M', newPrice: 3.9 }, validateSchemas: true });
    const seeded = seedRuns().find((r) => r.id === RUN_IDS[14]);
    expect(played.steps.map((s) => [s.stepId, s.status, s.attempts.length])).toEqual(
      (seeded?.steps ?? []).map((s) => [s.stepId, s.status, s.attempts.length]),
    );
  });

  it('seeds the session s-7f3a2c91 with its unexpected call', () => {
    const session = seedSessions()[0];
    expect(session?.id).toBe('s-7f3a2c91');
    expect(session?.calls.find((c) => c.stepId === 'unexpected')).toMatchObject({ method: 'GET', path: '/pastries?size=XL', httpStatus: 400 });
  });
});

describe('FixedClock', () => {
  it('is fixed at 2026-11-03T09:10:04Z', () => {
    expect(new FixedClock().now().toISOString()).toBe('2026-11-03T09:10:04.000Z');
  });
});

describe('latency', () => {
  it('is deterministic and within 120..350 ms', () => {
    const values = Array.from({ length: 50 }, () => nextLatencyMs());
    expect(values.every((v) => v >= 120 && v <= 350)).toBe(true);
    expect(new Set(values).size).toBeGreaterThan(10);
  });

  it('is zero in fast mode (always under Vitest)', async () => {
    expect(isFastMode()).toBe(true);
    await expect(latency()).resolves.toBeUndefined();
  });

  it('waits when forced to normal mode', async () => {
    vi.useFakeTimers();
    setLatencyMode('normal');
    let done = false;
    void latency().then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(100);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(300);
    expect(done).toBe(true);
  });
});

describe('streams', () => {
  it('createStream pushes to subscribers until they unsubscribe', () => {
    const stream = createStream<number>();
    const seen: number[] = [];
    const off = stream.subscribe((v) => seen.push(v));
    stream.emit(1);
    off();
    stream.emit(2);
    expect(seen).toEqual([1]);
    expect(stream.size).toBe(0);
  });

  it('ticking streams tick every 1200 ms and stop on unsubscribe', () => {
    vi.useFakeTimers();
    const subscribe = createTickingStream((n) => n);
    const seen: number[] = [];
    const off = subscribe((v) => seen.push(v));
    vi.advanceTimersByTime(TICK_MS * 3);
    off();
    vi.advanceTimersByTime(TICK_MS * 3);
    expect(seen).toEqual([0, 1, 2]);
  });

  it('sequence streams replay a finite list one item per tick', () => {
    vi.useFakeTimers();
    const seen: string[] = [];
    createSequenceStream(['a', 'b', 'c'])((v) => seen.push(v));
    vi.advanceTimersByTime(TICK_MS * 10);
    expect(seen).toEqual(['a', 'b', 'c']);
  });
});
