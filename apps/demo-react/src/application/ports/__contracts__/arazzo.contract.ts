import { describe, expect, it } from 'vitest';
import type { WorkflowRun } from '@microcks/demo-core/domain/arazzo';
import type { ArazzoPorts } from '@microcks/demo-core/application/arazzo';
import type { StartRunRequest } from '@microcks/demo-core/application/ports/arazzo';
import { collectFor, expectNotFound, expectSilentAfterUnsubscribe, nextEmission, takeEmissions, useAdapters, useFakeTimers, type MakeAdapters } from './support.contract';

/** The ports the arazzo feature owns (secrets belong to the importing feature). */
export type ArazzoOwnPorts = Pick<ArazzoPorts, 'documents' | 'runs' | 'runner' | 'sessions'>;

const RUN_IDS = { 14: '6729a1d27e4c0b5f93a8c214', 13: '67299b3e1f0a4c7d82e5b106', 12: '67290c5a9d3e41b7a6f8e215', 11: '6728f8d47b2c4e09a1d3c524', 15: '6729a3f08b1d6e2c45f7a930', checkMenu3: '6728e1a03c9b4f5d87e2a633' } as const;
const NOW = '2026-11-03T09:10:04.000Z';
const TICK_MS = 1200;

const mocksRun = (over: Partial<StartRunRequest> = {}): StartRunRequest => ({
  documentId: 'pastry',
  workflowId: 'restock-pastry',
  target: { kind: 'mocks' },
  origin: { kind: 'ui' },
  options: { example: 'restock-eclair', inputs: { size: 'M', newPrice: 3.9 }, timeoutMs: 10_000, validateSchemas: false },
  ...over,
});

/** Contract of `ArazzoRepository`, `WorkflowRunRepository`, `WorkflowRunner` and `SessionRepository` over the Arazzo seed. */
export function describeArazzoPortContract(name: string, makeAdapters: MakeAdapters<ArazzoOwnPorts>): void {
  describe(`arazzo ports contract · ${name}`, () => {
    const adapters = useAdapters(makeAdapters);
    const documents = () => adapters().documents;
    const runs = () => adapters().runs;
    const runner = () => adapters().runner;
    const sessions = () => adapters().sessions;

    describe('ArazzoRepository documents / workflows', () => {
      it('lists the pastry and beer documents, and returns one by id or undefined', async () => {
        expect((await documents().documents()).map((d) => d.id)).toEqual(['pastry', 'beer']);
        expect((await documents().document('pastry'))?.id).toBe('pastry');
        expect(await documents().document('nope')).toBeUndefined();
      });

      it('lists the 5 workflows, or those of one document', async () => {
        expect((await documents().workflows()).map((w) => w.workflowId)).toEqual(['restock-pastry', 'order-pastry', 'compare-prices', 'check-menu', 'checkout-beer']);
        expect((await documents().workflows('beer')).map((w) => w.workflowId)).toEqual(['checkout-beer']);
      });

      it('returns a workflow by document and id, or undefined', async () => {
        expect(await documents().workflow('pastry', 'restock-pastry')).toMatchObject({ summary: 'Restock a pastry', runnability: { runnable: true } });
        expect((await documents().workflow('beer', 'checkout-beer'))?.runnability.runnable).toBe(false);
        expect(await documents().workflow('beer', 'restock-pastry')).toBeUndefined();
      });
    });

    describe('ArazzoRepository.linkSource', () => {
      it('links beerCatalog to the Beer Catalog API and unblocks checkout-beer on the next read', async () => {
        const doc = await documents().linkSource('beer', 'beerCatalog', 'beer');
        expect(doc.sources[0]?.link).toMatchObject({ status: 'linked', serviceId: 'beer', protocol: 'REST' });
        expect((await documents().document('beer'))?.sources[0]?.link.status).toBe('linked');
        expect((await documents().workflow('beer', 'checkout-beer'))?.runnability.runnable).toBe(true);
      });

      it('fails with NotFoundError for an unknown source or service', async () => {
        await expectNotFound(documents().linkSource('beer', 'nope', 'beer'));
        await expectNotFound(documents().linkSource('beer', 'beerCatalog', 'nope'));
      });
    });

    describe('ArazzoRepository validate / source / overlay / examples', () => {
      it('returns the import issues of a document (none for an unknown one)', async () => {
        expect(Array.isArray(await documents().validate('pastry'))).toBe(true);
        expect(await documents().validate('nope')).toEqual([]);
      });

      it('serves the YAML source of each document and the ArazzoSources overlay of pastry only', async () => {
        expect(await documents().source('pastry')).toContain('restock-pastry');
        expect(await documents().source('beer')).toContain('checkout-beer');
        expect(await documents().overlay('pastry')).toContain('kind: ArazzoSources');
        expect(await documents().overlay('beer')).toBeUndefined();
      });

      it('lists the recorded examples of a workflow', async () => {
        expect((await documents().examples('pastry', 'restock-pastry')).map((e) => e.id)).toEqual(['restock-eclair', 'already-available']);
        expect(await documents().examples('pastry', 'check-menu')).toEqual([]);
      });
    });

    describe('WorkflowRunRepository', () => {
      it('lists the 5 seeded runs, filterable by document, workflow and origin', async () => {
        expect((await runs().list()).map((r) => r.id)).toEqual([RUN_IDS[14], RUN_IDS[13], RUN_IDS[12], RUN_IDS[11], RUN_IDS.checkMenu3]);
        expect((await runs().list({ workflowId: 'check-menu' })).map((r) => r.number)).toEqual([3]);
        expect((await runs().list({ documentId: 'pastry', workflowId: 'restock-pastry', origin: 'mock-url' })).map((r) => r.number)).toEqual([11]);
        expect(await runs().list({ documentId: 'beer' })).toEqual([]);
      });

      it('returns run #14 failing on staging, the scenario runs by id, and undefined otherwise', async () => {
        expect(await runs().get(RUN_IDS[14])).toMatchObject({ number: 14, status: 'FAILURE', relatedTestRunId: '119' });
        expect((await runs().get(RUN_IDS[15]))?.number).toBe(15);
        expect((await runs().list()).map((r) => r.id)).not.toContain(RUN_IDS[15]);
        expect(await runs().get('nope')).toBeUndefined();
      });

      it('saves a new run and replaces an existing one, visible on the next read', async () => {
        const run12 = (await runs().get(RUN_IDS[12]))!;
        await runs().save({ ...run12, id: 'run-contract', number: 99 });
        expect((await runs().get('run-contract'))?.number).toBe(99);
        await runs().save({ ...run12, status: 'FAILURE' });
        expect((await runs().get(RUN_IDS[12]))?.status).toBe('FAILURE');
        expect(await runs().list()).toHaveLength(6);
      });
    });

    describe('WorkflowRunner.start', () => {
      it('replays the seeded run #14 for the staging scenario', async () => {
        const runId = await runner().start(
          mocksRun({ target: { kind: 'implementations', baseUrls: { apiPastry: 'https://pastry.staging.acme.io/v2' } }, options: { example: 'restock-eclair', inputs: { size: 'M', newPrice: 3.9 }, timeoutMs: 10_000, validateSchemas: true } }),
        );
        expect(runId).toBe(RUN_IDS[14]);
      });

      it('creates the scenario run #15, then lists it', async () => {
        const runId = await runner().start(mocksRun({ options: { example: 'already-available', inputs: { size: 'L' }, timeoutMs: 10_000, validateSchemas: false } }));
        expect(runId).toBe(RUN_IDS[15]);
        expect((await runs().list()).map((r) => r.id)).toContain(RUN_IDS[15]);
      });

      it('simulates any other request as a new run with the next number, stored and listed', async () => {
        const runId = await runner().start(mocksRun());
        expect(runId).not.toBe(RUN_IDS[14]);
        expect(await runs().get(runId)).toMatchObject({ number: 17, status: 'SUCCESS', startedAt: NOW, outputs: { pastryName: 'Eclair Cafe' } });
        expect((await runs().list({ workflowId: 'restock-pastry' })).map((r) => r.id)).toContain(runId);
      });

      it('fails with NotFoundError for an unknown workflow', async () => {
        await expectNotFound(runner().start(mocksRun({ workflowId: 'nope' })));
      });
    });

    describe('WorkflowRunner.watch', () => {
      useFakeTimers();

      it('emits one frame per attempt then the final run (run #14: 6 frames)', async () => {
        const { values, unsubscribe } = await takeEmissions<WorkflowRun>(runner().watch(RUN_IDS[14]), (frames) => frames.some((f) => f.status !== 'RUNNING'));
        unsubscribe();
        expect(values.map((f) => (f.current ? `${f.current.stepId}#${f.current.attempt}` : 'done'))).toEqual([
          'listPastries#1', 'getPastry#1', 'patchPastry#1', 'patchPastry#2', 'patchPastry#3', 'done',
        ]);
        expect(values.at(-1)?.status).toBe('FAILURE');
      });

      it('stops emitting once unsubscribed', async () => {
        const { value, values, unsubscribe } = await nextEmission<WorkflowRun>(runner().watch(RUN_IDS[14]));
        expect(value.current?.stepId).toBe('listPastries');
        await expectSilentAfterUnsubscribe(values, unsubscribe, 10 * TICK_MS);
      });

      it('emits nothing for an unknown run', async () => {
        const { values, unsubscribe } = await collectFor<WorkflowRun>(runner().watch('nope'), 3 * TICK_MS);
        unsubscribe();
        expect(values).toEqual([]);
      });
    });

    describe('SessionRepository', () => {
      it('lists the 3 sessions of restock-pastry and returns one by id or undefined', async () => {
        expect((await sessions().list('pastry', 'restock-pastry')).map((s) => s.id)).toEqual(['s-7f3a2c91', 's-2b91e04d', 's-c4d07a18']);
        expect(await sessions().list('pastry', 'check-menu')).toEqual([]);
        expect(await sessions().get('s-2b91e04d')).toMatchObject({ state: 'open' });
        expect(await sessions().get('nope')).toBeUndefined();
      });

      it('opens a session first in the list, at the demo clock, with no call', async () => {
        const session = await sessions().open({ documentId: 'pastry', workflowId: 'restock-pastry', app: 'checkout-web', inputs: { size: 'M' } });
        expect(session).toMatchObject({ app: 'checkout-web', state: 'open', openedAt: NOW, calls: [] });
        expect((await sessions().list('pastry', 'restock-pastry'))[0]?.id).toBe(session.id);
        expect(await sessions().get(session.id)).toMatchObject({ id: session.id });
      });

      it('verifies a session: closes it and creates a run with the origin "session"', async () => {
        const session = await sessions().open({ documentId: 'pastry', workflowId: 'restock-pastry', app: 'checkout-web', inputs: { size: 'M' } });
        const verified = await sessions().verify(session.id);
        expect(verified).toMatchObject({ state: 'closed', closedAt: NOW, verification: { result: 'FAILURE', runNumber: 17 } });
        const created = await runs().list({ documentId: 'pastry', workflowId: 'restock-pastry', origin: 'session' });
        expect(created.find((r) => r.number === 17)).toMatchObject({ status: 'FAILURE', origin: { kind: 'session', sessionId: session.id } });
      });

      it('verifying twice returns the first verdict without a new run', async () => {
        const first = await sessions().verify('s-2b91e04d');
        const count = (await runs().list()).length;
        expect(await sessions().verify('s-2b91e04d')).toEqual(first);
        expect(await runs().list()).toHaveLength(count);
      });

      it('fails with NotFoundError when verifying an unknown session', async () => {
        await expectNotFound(sessions().verify('nope'));
      });
    });
  });
}
