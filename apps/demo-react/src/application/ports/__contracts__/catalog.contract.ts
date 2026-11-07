import { describe, expect, it } from 'vitest';
import { labelToString } from '@/domain/shared';
import type { CatalogPorts } from '@/application/catalog';
import { useAdapters, type MakeAdapters } from './support.contract';

/** Contract of `ServiceCatalog & CatalogExtensions` over the seeded catalogue (11 services). */
export function describeCatalogPortContract(name: string, makeAdapters: MakeAdapters<CatalogPorts>): void {
  describe(`catalog ports contract · ${name}`, () => {
    const adapters = useAdapters(makeAdapters);
    const catalog = () => adapters().catalog;

    describe('ServiceCatalog.list', () => {
      it('lists the 11 seeded services in seed order', async () => {
        const ids = (await catalog().list()).map((s) => s.id);
        expect(ids).toEqual(['pastry2', 'orders', 'movie', 'hellogrpc', 'petstore', 'pastry1', 'rocks', 'usersignedup', 'hellosoap', 'beer', 'concierge']);
      });

      it('filters by free text, protocol, test status and labels', async () => {
        const ids = async (filter: Parameters<CatalogPorts['catalog']['list']>[0]) => (await catalog().list(filter)).map((s) => s.id);
        expect(await ids({ query: 'pastry' })).toEqual(['pastry2', 'orders', 'pastry1', 'concierge']);
        expect(await ids({ protocols: ['EVENT'] })).toEqual(['orders', 'usersignedup']);
        expect(await ids({ testStatus: 'never' })).toEqual(['petstore', 'rocks', 'usersignedup']);
        expect(await ids({ labels: ['domain=pastry', 'status=GA'] })).toEqual(['pastry2']);
        expect(await ids({ query: 'no-such-service' })).toEqual([]);
      });
    });

    describe('ServiceCatalog.get', () => {
      it('returns API Pastry 2.0 failing on its last test', async () => {
        const pastry2 = await catalog().get('pastry2');
        expect(pastry2).toMatchObject({ id: 'pastry2', name: 'API Pastry', version: '2.0', protocol: 'REST', testStatus: 'failed' });
        expect(pastry2?.lastTest?.runId).toBe('119');
      });

      it('returns undefined for an unknown service', async () => {
        expect(await catalog().get('nope')).toBeUndefined();
      });
    });

    describe('ServiceCatalog.operations / operation', () => {
      it('lists the operations of a service in contract order', async () => {
        expect((await catalog().operations('pastry2')).map((o) => o.id)).toEqual(['get-list', 'get-name', 'patch-name']);
      });

      it('returns one operation, or undefined when the service or the operation is unknown', async () => {
        expect(await catalog().operation('pastry2', 'get-name')).toMatchObject({ id: 'get-name', method: 'GET', path: '/pastries/{name}' });
        expect(await catalog().operation('pastry2', 'nope')).toBeUndefined();
        expect(await catalog().operation('nope', 'get-name')).toBeUndefined();
        expect(await catalog().operations('nope')).toEqual([]);
      });
    });

    describe('ServiceCatalog.examples / addExamples and removeExample', () => {
      it('lists the 4 examples of GET /pastries/{name}, including the pending AI proposal', async () => {
        const examples = await catalog().examples('pastry2', 'get-name');
        expect(examples).toHaveLength(4);
        expect(examples.filter((e) => e.reviewState === 'pending').map((e) => e.name)).toEqual(['Tartelette Framboise']);
      });

      it('returns no example for an unknown operation', async () => {
        expect(await catalog().examples('pastry2', 'nope')).toEqual([]);
      });

      it('appends new examples and shows them on the next read', async () => {
        const added = { id: 'ex-contract', name: 'Paris-Brest', request: { params: { name: 'Paris-Brest' } }, response: { status: 200, body: '{}' } };
        await catalog().addExamples('pastry2', 'get-name', [added]);
        const after = await catalog().examples('pastry2', 'get-name');
        expect(after).toHaveLength(5);
        expect(after.at(-1)).toMatchObject({ id: 'ex-contract', name: 'Paris-Brest' });
      });

      it('replaces an example with the same id in place (a pending proposal becomes accepted)', async () => {
        const before = await catalog().examples('pastry2', 'get-name');
        const index = before.findIndex((e) => e.reviewState === 'pending');
        const pending = before[index]!;
        await catalog().addExamples('pastry2', 'get-name', [{ ...pending, reviewState: 'accepted' }]);
        const after = await catalog().examples('pastry2', 'get-name');
        expect(after).toHaveLength(before.length);
        expect(after[index]).toMatchObject({ id: pending.id, reviewState: 'accepted' });
      });

      it('removes an example and can put it back', async () => {
        const before = await catalog().examples('pastry2', 'get-name');
        const removed = before[0]!;
        await catalog().removeExample('pastry2', 'get-name', removed.id);
        expect((await catalog().examples('pastry2', 'get-name')).map((e) => e.id)).not.toContain(removed.id);
        await catalog().addExamples('pastry2', 'get-name', [removed]);
        expect(await catalog().examples('pastry2', 'get-name')).toHaveLength(before.length);
      });

      it('does not let a caller mutate the stored examples through a returned list', async () => {
        const first = await catalog().examples('pastry2', 'get-name');
        first[0]!.name = 'mutated by the caller';
        expect((await catalog().examples('pastry2', 'get-name'))[0]?.name).not.toBe('mutated by the caller');
      });
    });

    describe('ServiceCatalog.behavior / saveBehavior', () => {
      it('derives the default behavior of an operation from its dispatcher', async () => {
        expect(await catalog().behavior('pastry2', 'get-name')).toMatchObject({ dispatcher: 'URI_PARTS', rule: 'name', stateful: false });
      });

      it('returns undefined for an unknown operation', async () => {
        expect(await catalog().behavior('pastry2', 'nope')).toBeUndefined();
      });

      it('returns the saved behavior on the next read', async () => {
        const saved = (await catalog().behavior('pastry2', 'get-name'))!;
        await catalog().saveBehavior('pastry2', 'get-name', { ...saved, delayMs: 250 });
        expect((await catalog().behavior('pastry2', 'get-name'))?.delayMs).toBe(250);
        expect((await catalog().behavior('pastry2', 'get-list'))?.delayMs).toBe(saved.delayMs);
      });
    });

    describe('ServiceCatalog.workflowUsages', () => {
      it('lists the 4 pastry workflows that call API Pastry 2.0 with the last result of each', async () => {
        const usages = await catalog().workflowUsages('pastry2');
        expect(usages.map((u) => u.workflowId)).toEqual(['restock-pastry', 'order-pastry', 'compare-prices', 'check-menu']);
        expect(usages.find((u) => u.workflowId === 'restock-pastry')?.result).toMatchObject({ kind: 'failed', runNumber: 14 });
        expect(usages.find((u) => u.workflowId === 'order-pastry')?.result).toEqual({ kind: 'blocked', reason: 'Cannot run yet · AsyncAPI steps' });
      });

      it('returns no usage for a service no workflow calls', async () => {
        expect(await catalog().workflowUsages('petstore')).toEqual([]);
      });
    });

    describe('CatalogExtensions.details', () => {
      it('derives the artifacts, MCP tools and mock base URL of a service', async () => {
        const details = await catalog().details('pastry2');
        expect(details?.artifacts.map((a) => a.role)).toEqual(['primary', 'secondary']);
        expect(details?.mcp?.tools).toHaveLength(3);
        expect(details?.mockBase).toBe('http://microcks.local:8080/rest/API+Pastry/2.0');
      });

      it('returns undefined for an unknown service', async () => {
        expect(await catalog().details('nope')).toBeUndefined();
      });
    });

    describe('ServiceCatalog.labels', () => {
      it('counts every label across services, sorted by "key=value"', async () => {
        const labels = await catalog().labels();
        const keys = labels.map((l) => labelToString(l.label));
        expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)));
        expect(labels.find((l) => labelToString(l.label) === 'domain=pastry')?.count).toBe(4);
      });
    });

    describe('ServiceCatalog.commands', () => {
      it('lists the pages, then every service, then every workflow', async () => {
        const commands = await catalog().commands();
        expect(commands.slice(0, 6).every((c) => c.kind === 'Page')).toBe(true);
        expect(commands.filter((c) => c.kind === 'Service')).toHaveLength(11);
        expect(commands.find((c) => c.id === 'service-pastry2')).toMatchObject({ label: 'API Pastry 2.0', href: '/services/pastry2' });
        expect(commands.find((c) => c.id === 'workflow-restock-pastry')?.href).toBe('/workflows/pastry/restock-pastry');
      });
    });
  });
}
