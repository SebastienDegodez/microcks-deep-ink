import { describe, expect, it } from 'vitest';
import { createTestingUseCases } from '@/application/testing';
import type { ServiceCatalog } from '@/application/ports/catalog';
import type { SecretRepository } from '@/application/ports/importing';
import { NotFoundError, ValidationError } from '@/application/shared';
import { SERVICES } from '../shared';
import { createInMemoryTestingAdapters } from './index';

function setup() {
  const { testRuns } = createInMemoryTestingAdapters();
  const catalog = { list: async () => SERVICES } as unknown as ServiceCatalog;
  const secrets = { list: async () => [] } as unknown as SecretRepository;
  return createTestingUseCases({ testRuns, catalog, secrets });
}

describe('testing use cases', () => {
  it('keeps run #119 failed on the price bug and #118 passed at 92% in the history', async () => {
    const uc = setup();
    const runs = await uc.listForService('pastry2');
    expect(runs).toHaveLength(21);
    expect(runs.slice(0, 3).map((r) => [r.id, r.result, r.passed])).toEqual([['119', 'failed', 6], ['118', 'passed', 7], ['117', 'failed', 6]]);
    const run = await uc.get('119');
    expect(run.live).toBe(true);
    const bad = run.steps.find((s) => s.result === 'failed');
    expect(bad).toMatchObject({ operationId: 'patch-name', method: 'PATCH' });
    expect(bad?.violations.map((v) => v.path)).toEqual(['$.price', '$.status']);
    expect(bad?.payload).toMatchObject({ price: '2.6', status: 'sold-out' });
    await expect(uc.get('9999')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('filters the history and builds the timeline oldest first', async () => {
    const uc = setup();
    const failed = await uc.listForService('pastry2', { result: 'failed' });
    expect(failed.map((r) => r.id)).toEqual(['119', '117', '113', '110', '108', '103']);
    expect((await uc.listForService('pastry2', { environment: 'local' })).map((r) => r.id)).toEqual(['111', '99']);
    const timeline = await uc.timeline('pastry2');
    expect(timeline[0]?.runId).toBe('99');
    expect(timeline.at(-1)).toMatchObject({ runId: '119', conformance: 86 });
    expect(timeline.find((p) => p.runId === '118')?.conformance).toBe(92);
  });

  it('offers the services that can be tested with their runners and operations', async () => {
    const uc = setup();
    const form = await uc.getCreateForm('beer');
    expect(form.services.map((s) => s.id)).toEqual(['pastry2', 'orders', 'movie', 'hellogrpc', 'pastry1', 'hellosoap', 'beer']);
    expect(form.defaults).toMatchObject({ serviceId: 'beer', runner: 'POSTMAN' });
    expect((await uc.getCreateForm()).defaults.serviceId).toBe('pastry2');
    expect(form.targets.find((t) => t.serviceId === 'pastry2')?.operations).toHaveLength(3);
  });

  it('creates a run, refuses an invalid form, and streams one step per tick', async () => {
    const uc = setup();
    const input = { serviceId: 'pastry2', endpoint: 'https://pastry.staging.acme.io/v2', runner: 'OPEN_API_SCHEMA' as const, timeoutMs: 10_000 };
    const created = await uc.create(input);
    expect(created.id).toBe('120');
    expect(created.total).toBe(7);
    await expect(uc.create({ ...input, endpoint: 'ftp://nope' })).rejects.toBeInstanceOf(ValidationError);
    await expect(uc.create({ ...input, runner: 'SOAP_UI' })).rejects.toThrow('not available');
    await expect(uc.create({ ...input, operations: [] })).rejects.toThrow('at least one operation');

    const emissions: number[] = [];
    const stop = uc.watch('120', (run) => emissions.push(run.steps.length));
    expect(typeof stop).toBe('function');
    stop();
  });
});
