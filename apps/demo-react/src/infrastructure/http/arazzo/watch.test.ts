// @vitest-environment node
import { http as mswHttp, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkflowRun } from '@/domain/arazzo';
import { settle } from '@/application/ports/__contracts__/support.contract';
import { createHttpClient } from '@/infrastructure/http/client';
import { createInMemoryArazzoAdapters } from '@/infrastructure/in-memory/arazzo';
import { FixedClock } from '@/infrastructure/in-memory/shared';
import { server } from '@/infrastructure/msw/node';
import { createHttpArazzoAdapters, RUN_POLL_MS } from '.';

const RUN_14 = '6729a1d27e4c0b5f93a8c214';

describe('runner.watch over a backend without the progress feed (the POC)', () => {
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }));
  afterEach(() => {
    vi.useRealTimers();
    server.resetHandlers();
  });
  afterAll(() => server.close());

  it('polls GET /api/arazzo/runs/{runId}, emits each change once and stops at the final status', async () => {
    const final = (await createInMemoryArazzoAdapters().runs.get(RUN_14))!;
    const answers: WorkflowRun[] = [
      { ...final, status: 'RUNNING', current: { stepId: 'listPastries', attempt: 1 } },
      { ...final, status: 'RUNNING', current: { stepId: 'listPastries', attempt: 1 } },
      { ...final, status: 'RUNNING', current: { stepId: 'getPastry', attempt: 1 } },
      final,
    ];
    let requests = 0;
    server.use(
      mswHttp.get('*/api/arazzo/runs/:runId/progress', () => new HttpResponse(null, { status: 404 })),
      mswHttp.get('*/api/arazzo/runs/:runId', () => HttpResponse.json(answers[Math.min(requests++, answers.length - 1)])),
    );
    const { runner } = createHttpArazzoAdapters({ http: createHttpClient({ baseUrl: 'http://demo.test/api/' }), clock: new FixedClock() });

    const frames: WorkflowRun[] = [];
    const unsubscribe = runner.watch(RUN_14)((run) => frames.push(run));
    await settle();
    for (let i = 0; i < 6; i += 1) {
      await vi.advanceTimersByTimeAsync(RUN_POLL_MS);
      await settle();
    }
    unsubscribe();

    expect(frames.map((f) => f.current?.stepId ?? f.status)).toEqual(['listPastries', 'getPastry', 'FAILURE']);
    expect(requests).toBe(4);
  });

  it('emits nothing and stops polling for an unknown run', async () => {
    let requests = 0;
    server.use(
      mswHttp.get('*/api/arazzo/runs/:runId/progress', () => new HttpResponse(null, { status: 404 })),
      mswHttp.get('*/api/arazzo/runs/:runId', () => {
        requests += 1;
        return new HttpResponse(null, { status: 404 });
      }),
    );
    const { runner } = createHttpArazzoAdapters({ http: createHttpClient({ baseUrl: 'http://demo.test/api/' }), clock: new FixedClock() });
    const frames: WorkflowRun[] = [];
    const unsubscribe = runner.watch('nope')((run) => frames.push(run));
    await settle();
    await vi.advanceTimersByTimeAsync(5 * RUN_POLL_MS);
    unsubscribe();
    expect(frames).toEqual([]);
    expect(requests).toBe(1);
  });
});
