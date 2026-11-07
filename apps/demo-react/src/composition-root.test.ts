import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundError, ValidationError } from '@/application/shared';
import type { UseCases } from '@/application/use-cases';
import { createComposition, createUseCases, parseBackend } from './composition-root';

let uc: UseCases;
beforeEach(() => {
  uc = createUseCases();
});

describe('catalog use cases', () => {
  it('lists the 11 seeded services and filters them', async () => {
    expect(await uc.catalog.listServices()).toHaveLength(11);
    expect((await uc.catalog.listServices({ query: 'pastry' })).map((s) => s.id)).toEqual(['pastry2', 'orders', 'pastry1', 'concierge']);
    expect((await uc.catalog.listServices({ protocols: ['EVENT'] })).map((s) => s.id)).toEqual(['orders', 'usersignedup']);
    expect((await uc.catalog.listServices({ testStatus: 'never' })).map((s) => s.id)).toEqual(['petstore', 'rocks', 'usersignedup']);
    expect((await uc.catalog.listServices({ labels: ['domain=pastry', 'status=GA'] })).map((s) => s.id)).toEqual(['pastry2']);
  });

  it('throws NotFoundError for an unknown service', async () => {
    await expect(uc.catalog.getService('nope')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('serves operations, examples and the workflows that use API Pastry 2.0', async () => {
    expect((await uc.catalog.listOperations('pastry2')).map((o) => o.id)).toEqual(['get-list', 'get-name', 'patch-name']);
    expect(await uc.catalog.listExamples('pastry2', 'get-name')).toHaveLength(4);
    const usages = await uc.catalog.workflowUsages('pastry2');
    expect(usages.map((u) => u.workflowId)).toEqual(['restock-pastry', 'order-pastry', 'compare-prices', 'check-menu']);
  });

  it('simulates a request against the examples', async () => {
    const hit = await uc.catalog.simulate('pastry2', 'get-name', { path: '/pastries/Millefeuille', params: {}, headers: { 'x-api-key': 'demo-7f3a' } });
    expect(hit).toMatchObject({ matched: true, exampleId: 'millefeuille' });
    const miss = await uc.catalog.simulate('pastry2', 'get-name', { path: '/pastries/Tarte%20Tatin', params: {}, headers: { 'x-api-key': 'demo-7f3a' } });
    expect(miss.matched).toBe(false);
  });
});

describe('copilot use cases', () => {
  it('generates pending suggestions led by the hint, and accepting adds the example to the catalogue', async () => {
    const [first] = await uc.copilot.generate({ serviceId: 'pastry2', operationId: 'get-name', count: 2, hint: 'Tarte Tatin' });
    expect(first).toMatchObject({ name: 'Tarte Tatin', aiGenerated: true, reviewState: 'pending' });
    if (!first) throw new Error('no suggestion');
    await uc.copilot.accept('pastry2', 'get-name', first);
    const examples = await uc.catalog.listExamples('pastry2', 'get-name');
    expect(examples.find((e) => e.name === 'Tarte Tatin')?.reviewState).toBe('accepted');
  });

  it('exports YAML and JSON', async () => {
    const examples = await uc.catalog.listExamples('pastry2', 'get-list');
    expect(uc.copilot.export(examples, 'yaml').text.startsWith('examples:')).toBe(true);
    expect(JSON.parse(uc.copilot.export(examples, 'json').text).examples).toHaveLength(3);
  });
});

describe('arazzo use cases', () => {
  it('lists the 5 workflows of the 2 documents', async () => {
    expect(await uc.arazzo.listDocuments()).toHaveLength(2);
    expect((await uc.arazzo.listWorkflows()).map((i) => i.workflow.workflowId)).toEqual([
      'restock-pastry', 'order-pastry', 'compare-prices', 'check-menu', 'checkout-beer',
    ]);
  });

  it('filters by result and by run kind', async () => {
    const failed = await uc.arazzo.listWorkflows({ result: 'failed' });
    expect(failed.map((i) => i.workflow.workflowId)).toEqual(['restock-pastry']);
    expect(failed[0]?.lastRun?.number).toBe(14);
    const onImpl = await uc.arazzo.listWorkflows({ runKind: 'implementations' });
    expect(onImpl.find((i) => i.workflow.workflowId === 'restock-pastry')?.lastRun?.number).toBe(14);
    expect((await uc.arazzo.listWorkflows({ result: 'never' })).map((i) => i.workflow.workflowId)).toEqual(['order-pastry', 'compare-prices', 'checkout-beer']);
    expect((await uc.arazzo.listWorkflows({ query: 'beer' })).map((i) => i.workflow.workflowId)).toEqual(['checkout-beer']);
  });

  it('returns run #14 by id with its failing step', async () => {
    const run = await uc.arazzo.getRun('6729a1d27e4c0b5f93a8c214');
    expect(run.status).toBe('FAILURE');
    expect(run.steps.map((s) => s.status)).toEqual(['passed', 'passed', 'failed', 'not-run']);
    await expect(uc.arazzo.getRun('nope')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('runs the scenarios of the setup form', async () => {
    const setup = await uc.arazzo.getRunSetup('pastry', 'restock-pastry', 'impl14');
    expect(setup.defaults).toMatchObject({ target: 'implementations', secret: 'pastry-staging-oauth', validateSchemas: true });
    const { runId } = await uc.arazzo.startRun({
      documentId: 'pastry', workflowId: 'restock-pastry', target: 'implementations', baseUrls: setup.defaults.baseUrls,
      secret: setup.defaults.secret, example: 'restock-eclair', inputs: setup.defaults.inputs, validateSchemas: true, timeoutMs: 10_000,
    });
    expect(runId).toBe('6729a1d27e4c0b5f93a8c214');
  });

  it('refuses to start a workflow that cannot run', async () => {
    await expect(
      uc.arazzo.startRun({ documentId: 'pastry', workflowId: 'order-pastry', target: 'mocks', baseUrls: {}, inputs: {}, validateSchemas: false, timeoutMs: 10_000 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('makes checkout-beer runnable once beerCatalog is linked', async () => {
    await uc.arazzo.linkSource('beer', 'beerCatalog', 'beer');
    const { workflow } = await uc.arazzo.getWorkflow('beer', 'checkout-beer');
    expect(workflow.runnability.runnable).toBe(true);
  });

  it('lists the session s-7f3a2c91 and the examples of restock-pastry', async () => {
    const sessions = await uc.arazzo.listSessions('pastry', 'restock-pastry');
    expect(sessions.map((s) => s.id)).toContain('s-7f3a2c91');
    expect((await uc.arazzo.listExamples('pastry', 'restock-pastry')).map((e) => e.id)).toEqual(['restock-eclair', 'already-available']);
  });
});

describe('testing, observe, govern and importing use cases', () => {
  it('serves test runs #119, #118, #117 for API Pastry', async () => {
    const runs = await uc.testing.listForService('pastry2');
    expect(runs.slice(0, 3).map((r) => [r.id, r.result])).toEqual([['119', 'failed'], ['118', 'passed'], ['117', 'failed']]);
    const run = await uc.testing.get('119');
    expect(run.steps).toHaveLength(7);
    expect(run.steps[6]?.violations.map((v) => v.path)).toEqual(['$.price', '$.status']);
    await expect(uc.testing.get('9999')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('builds the cockpit from the catalogue and the test runs', async () => {
    const cockpit = await uc.observe.getCockpit();
    expect(cockpit.asOf).toBe('2026-11-03T09:10:04.000Z');
    expect(cockpit.kpis.services).toBe(11);
    // movie, pastry1, beer, concierge (run #3) and, since test #119, pastry2
    expect(cockpit.kpis.failingServices).toBe(5);
    expect(cockpit.recentTests[0]?.id).toBe('119');
    // The 6 latest runs, at most 2 per service; the week's verdicts (the #113 timeout is left out).
    expect(cockpit.recentTests.map((r) => r.id)).toEqual(['119', '41', '3', '118', '17', '9']);
    expect(cockpit.kpis.tests7d).toEqual({ passed: 14, failed: 7 });
    expect(cockpit.recentCalls.map((c) => c.protocol)).toEqual(['REST', 'gRPC', 'REST', 'GRAPHQL', 'EVENT']);
  });

  it('computes invocations and conformance by domain', async () => {
    expect((await uc.observe.invocations('pastry2', 'day')).points).toHaveLength(24);
    expect((await uc.observe.conformanceByDomain()).find((d) => d.domain === 'pastry')?.services).toBe(3);
  });

  it('installs a hub package and reports progress', async () => {
    const progress: number[] = [];
    const installed = await uc.govern.install('banking', { version: '1.2.0', mode: 'sync', role: 'user' }, (p) => progress.push(p));
    expect(installed.installed).toBe(true);
    expect(progress).toEqual([0, 100]);
  });

  it('shares one secret store between importing, admin and the run form', async () => {
    await uc.govern.createSecret({ name: 'new-token', kind: 'token', value: 'abcdef123456' });
    expect((await uc.importing.listSecrets()).map((s) => s.name)).toContain('new-token');
    expect((await uc.arazzo.getRunSetup('pastry', 'restock-pastry')).secrets.map((s) => s.name)).toContain('new-token');
  });

  it('analyzes and imports a contract', async () => {
    const preview = await uc.importing.analyze({ kind: 'url', url: 'https://acme.io/pastry.yaml' });
    expect(preview.services[0]?.operations).toHaveLength(3);
    expect((await uc.importing.import(preview.previewId, { role: 'primary' })).serviceId).toBe('pastry2');
  });
});

describe('backend switch', () => {
  it('defaults to the in-memory backend', () => {
    expect(createComposition()).toMatchObject({ backend: 'memory', httpFeatures: [] });
  });

  it('falls back to memory per feature when the http backend has no adapter for it', async () => {
    const composition = createComposition({ backend: 'http', apiBaseUrl: 'http://demo.test/api/' });
    expect(composition).toMatchObject({ backend: 'http', httpFeatures: ['catalog', 'copilot', 'importing', 'testing', 'arazzo', 'observe', 'govern'] });
    expect((await composition.useCases.agents.getAgent('concierge')).serviceId).toBe('concierge');
  });

  it('parses VITE_DEMO_BACKEND', () => {
    expect(parseBackend(undefined)).toBe('memory');
    expect(parseBackend('')).toBe('memory');
    expect(parseBackend('http')).toBe('http');
    expect(() => parseBackend('graphql')).toThrow('Unknown demo backend "graphql": expected one of memory, http.');
  });
});
