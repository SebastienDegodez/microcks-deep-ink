// @vitest-environment node
import { http as mswHttp, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TraceCall } from '@/domain/observe';
import { settle } from '@/application/ports/__contracts__/support.contract';
import { createHttpClient } from '@/infrastructure/http/client';
import { FixedClock } from '@/infrastructure/in-memory/shared';
import { makeCall } from '@/infrastructure/in-memory/observe';
import { server } from '@/infrastructure/msw/node';
import { createHttpObserveAdapters, TRAFFIC_POLL_MS } from '.';

/** A `calls` handler that holds every request until the test releases it, counting the requests and those in flight. */
function slowCallsHandler() {
  const state = { requests: 0, inFlight: 0, maxInFlight: 0, aborted: 0, pending: [] as (() => void)[] };
  server.use(
    mswHttp.get('*/api/demo/traffic/calls', async ({ request }) => {
      state.requests += 1;
      state.inFlight += 1;
      state.maxInFlight = Math.max(state.maxInFlight, state.inFlight);
      request.signal.addEventListener('abort', () => (state.aborted += 1));
      await new Promise<void>((resolve) => state.pending.push(resolve));
      state.inFlight -= 1;
      const after = Number(new URL(request.url).searchParams.get('after') ?? 10);
      return HttpResponse.json<TraceCall[]>([makeCall(after + 1)]);
    }),
  );
  const releaseAll = async () => {
    for (const resolve of state.pending.splice(0)) resolve();
    await settle();
  };
  return { state, releaseAll };
}

describe('polling streams (traffic ticker over http)', () => {
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-11-03T09:10:04Z'), toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
    server.resetHandlers();
  });
  afterAll(() => server.close());

  const adapters = () => createHttpObserveAdapters({ http: createHttpClient({ baseUrl: 'http://demo.test/api/' }), clock: new FixedClock() });
  const advance = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms);
    await settle();
  };

  it('keeps at most one request in flight and does not burst after a stall', async () => {
    const { state, releaseAll } = slowCallsHandler();
    const values: TraceCall[] = [];
    const unsubscribe = adapters().traffic.subscribe((c) => values.push(c));

    await advance(TRAFFIC_POLL_MS);
    expect(state.requests).toBe(1);
    // A 12 s stall: ten ticks would have fired with setInterval.
    await advance(12_000);
    expect(state.requests).toBe(1);

    await releaseAll();
    expect(values.map((c) => c.seq)).toEqual([11]);
    // No catch-up: nothing more until one interval after the answer.
    await advance(TRAFFIC_POLL_MS - 100);
    expect(state.requests).toBe(1);
    await advance(100);
    expect(state.requests).toBe(2);
    await releaseAll();
    expect(values.map((c) => c.seq)).toEqual([11, 12]);
    expect(state.maxInFlight).toBe(1);
    unsubscribe();
  });

  it('unsubscribing during a request aborts it, drops its answer and cancels the next tick', async () => {
    const { state, releaseAll } = slowCallsHandler();
    const values: TraceCall[] = [];
    const unsubscribe = adapters().traffic.subscribe((c) => values.push(c));

    await advance(TRAFFIC_POLL_MS);
    expect(state.requests).toBe(1);
    unsubscribe();
    await settle();
    expect(state.aborted).toBe(1);
    await releaseAll();
    await advance(10 * TRAFFIC_POLL_MS);
    expect(values).toEqual([]);
    expect(state.requests).toBe(1);
  });
});
