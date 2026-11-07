import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setLatencyMode } from '@/infrastructure/in-memory/shared';
import { API } from './api';
import { createLatencyHandlers } from './latency';

const server = setupServer(...createLatencyHandlers(), http.all(`${API}/*`, () => HttpResponse.json({ ok: true })));

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => setLatencyMode(undefined));
afterAll(() => server.close());

async function elapsed(path: string): Promise<number> {
  const start = performance.now();
  const response = await fetch(`http://demo.test/microcks-deep-ink/demo/api/${path}`);
  expect(await response.json()).toEqual({ ok: true });
  return performance.now() - start;
}

describe('latency handler', () => {
  it('delays each /api/ request once (120..350 ms), then lets the answering handler through', async () => {
    setLatencyMode('normal');
    const ms = await elapsed('services/count');
    expect(ms).toBeGreaterThanOrEqual(110);
    expect(ms).toBeLessThan(1000);
  });

  it('does not delay in fast mode, nor the polled feeds', async () => {
    setLatencyMode('fast');
    expect(await elapsed('services')).toBeLessThan(100);
    setLatencyMode('normal');
    expect(await elapsed('arazzo/runs/r1/progress')).toBeLessThan(100);
    expect(await elapsed('demo/traces/calls')).toBeLessThan(100);
  });
});
