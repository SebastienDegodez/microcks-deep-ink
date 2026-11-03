import { beforeEach, describe, expect, it } from 'vitest';
import type { SecretRepository } from '@/application/ports/importing';
import { createCatalogUseCases } from '@/application/catalog';
import { createTestingUseCases } from '@/application/testing';
import { facetCounts } from '@/domain/catalog';
import { createInMemoryTestingAdapters } from '../testing';
import { createInMemoryCatalogAdapters } from '.';

let uc: { catalog: ReturnType<typeof createCatalogUseCases>; testing: ReturnType<typeof createTestingUseCases> };
beforeEach(() => {
  const catalog = createInMemoryCatalogAdapters();
  const testing = createInMemoryTestingAdapters();
  uc = {
    catalog: createCatalogUseCases({ catalog: catalog.catalog }),
    testing: createTestingUseCases({ testRuns: testing.testRuns, catalog: catalog.catalog, secrets: { list: async () => [] } as unknown as SecretRepository }),
  };
});

const KEY = { 'x-api-key': 'demo-7f3a' };

describe('Catalogue screen', () => {
  it('shows API Pastry 2.0 failing with test #119 and keeps #118 in the history', async () => {
    const pastry2 = await uc.catalog.getService('pastry2');
    expect(pastry2.testStatus).toBe('failed');
    expect(pastry2.lastTest?.runId).toBe('119');
    const runs = await uc.testing.listForService('pastry2');
    expect(runs.map((r) => r.id).slice(0, 3)).toEqual(['119', '118', '117']);
  });

  it('browses with totals, workflow usage and facet counts that ignore their own selection', async () => {
    const view = await uc.catalog.browse({ protocols: ['REST'], testStatus: 'failed' });
    expect(view.total).toBe(10);
    expect(view.operationsTotal).toBeGreaterThan(20);
    expect(view.workflowsUsing).toBeGreaterThan(0);
    expect(view.services.map((s) => s.id).sort()).toEqual(['beer', 'pastry1', 'pastry2']);
    // A protocol chip counts the services that match every OTHER filter (failing): movie fails too.
    expect(view.facets.protocols.REST).toBe(3);
    expect(view.facets.protocols.GRAPHQL).toBe(1);
    expect(view.facets.protocols.EVENT ?? 0).toBe(0);
    // The status counts ignore the status selection but keep the REST one.
    expect(view.facets.testStatus.failed).toBe(3);
    expect(view.facets.testStatus.all).toBeGreaterThan(view.facets.testStatus.failed);
  });

  it('filters by label and name, and facetCounts works on any list', async () => {
    const all = await uc.catalog.listServices();
    expect((await uc.catalog.browse({ labels: ['status=GA'], query: 'hello' })).services.map((s) => s.id)).toEqual(['hellogrpc', 'hellosoap']);
    expect(facetCounts(all, { query: 'zzz' }).testStatus.all).toBe(0);
  });
});

describe('Service screen', () => {
  it('derives the details: artifacts, MCP tools and base URL', async () => {
    const d = await uc.catalog.getServiceDetails('pastry2');
    expect(d.artifacts.map((a) => a.role)).toEqual(['primary', 'secondary']);
    expect(d.mcp?.tools).toHaveLength(3);
    expect(d.mockBase).toBe('http://microcks.local:8080/rest/API+Pastry/2.0');
    expect(JSON.parse(d.mcp?.tools[1]?.inputSchema ?? '{}').required).toContain('name');
  });

  it('removes an example and puts it back', async () => {
    const before = await uc.catalog.listExamples('pastry2', 'get-name');
    const pending = before.find((e) => e.reviewState === 'pending');
    expect(pending?.name).toBe('Tartelette Framboise');
    await uc.catalog.removeExample('pastry2', 'get-name', pending?.id ?? '');
    expect(await uc.catalog.listExamples('pastry2', 'get-name')).toHaveLength(before.length - 1);
    await uc.catalog.addExamples('pastry2', 'get-name', [pending!]);
    expect(await uc.catalog.listExamples('pastry2', 'get-name')).toHaveLength(before.length);
  });

  it('lists the workflow steps and last result per workflow', async () => {
    const usages = await uc.catalog.workflowUsages('pastry2');
    const restock = usages.find((u) => u.workflowId === 'restock-pastry');
    expect(restock?.steps?.length).toBeGreaterThan(0);
    expect(restock?.result).toMatchObject({ kind: 'failed', runNumber: 14 });
  });
});

describe('Behavior screen', () => {
  it('simulates the saved behavior: match, 404 and constraint violation', async () => {
    const hit = await uc.catalog.simulate('pastry2', 'get-name', { path: '/pastries/Eclair%20Cafe', params: {}, headers: KEY });
    expect(hit).toMatchObject({ matched: true, status: 200 });
    expect(hit.chain).toContain('Eclair Cafe');
    const miss = await uc.catalog.simulate('pastry2', 'get-name', { path: '/pastries/Kouign-amann', params: {}, headers: KEY });
    expect(miss).toMatchObject({ matched: false, status: 404 });
    const noKey = await uc.catalog.simulate('pastry2', 'get-name', { path: '/pastries/Millefeuille', params: {} });
    expect(noKey).toMatchObject({ matched: false, status: 400, outcome: 'constraint' });
    const badSize = await uc.catalog.simulate('pastry2', 'get-name', { path: '/pastries/Millefeuille?size=XL', params: {}, headers: KEY });
    expect(badSize.status).toBe(400);
  });

  it('simulates an unsaved draft: FALLBACK serves the default example, PROXY_FALLBACK forwards', async () => {
    const saved = await uc.catalog.behavior('pastry2', 'get-name');
    const fallback = await uc.catalog.simulate('pastry2', 'get-name', { path: '/pastries/Kouign-amann', params: {}, headers: KEY }, { ...saved, dispatcher: 'FALLBACK', fallback: 'Millefeuille' });
    expect(fallback).toMatchObject({ matched: true, status: 200 });
    const proxy = await uc.catalog.simulate('pastry2', 'get-name', { path: '/pastries/Kouign-amann', params: {}, headers: KEY }, { ...saved, dispatcher: 'PROXY_FALLBACK', proxyUrl: 'https://pastry.staging.acme.io/v2' });
    expect(proxy).toMatchObject({ status: null, outcome: 'forwarded', forwardedTo: expect.stringContaining('pastry.staging.acme.io') });
    // the saved behavior did not change
    expect((await uc.catalog.behavior('pastry2', 'get-name')).dispatcher).toBe('URI_PARTS');
  });

  it('saves a behavior', async () => {
    const saved = await uc.catalog.behavior('pastry2', 'get-name');
    await uc.catalog.saveBehavior('pastry2', 'get-name', { ...saved, delayMs: 250 });
    expect((await uc.catalog.behavior('pastry2', 'get-name')).delayMs).toBe(250);
  });

  it('counts calls of a stateful SCRIPT mock through the store', async () => {
    const saved = await uc.catalog.behavior('pastry2', 'get-name');
    const draft = { ...saved, stateful: true, dispatcher: 'SCRIPT' as const, scriptLanguage: 'GROOVY' as const, script: 'def v = store.get("x")\nreturn name' };
    const result = await uc.catalog.simulate('pastry2', 'get-name', { path: '/pastries/Millefeuille', params: {}, headers: KEY, store: {} }, draft);
    expect(result.storeKey).toBeDefined();
  });
});
