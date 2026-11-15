import { describe, expect, it } from 'vitest';
import type { CopilotPorts } from '@microcks/demo-core/application/copilot';
import { useAdapters, type MakeAdapters } from './support.contract';

/** The ports the Copilot feature owns (it reads the catalogue through the catalog feature's port). */
export type CopilotOwnPorts = Pick<CopilotPorts, 'copilot'>;

/** Contract of `CopilotGateway & CopilotExtensions`: a deterministic "AI" over the pastry seed. */
export function describeCopilotPortContract(name: string, makeAdapters: MakeAdapters<CopilotOwnPorts>): void {
  describe(`copilot ports contract · ${name}`, () => {
    const adapters = useAdapters(makeAdapters);
    const copilot = () => adapters().copilot;

    describe('CopilotGateway.suggestExamples', () => {
      it('returns `count` pending AI examples, led by the hinted pastry', async () => {
        const proposals = await copilot().suggestExamples('pastry2', 'get-name', { count: 3, hint: 'Tarte Tatin' });
        expect(proposals).toHaveLength(3);
        expect(proposals[0]).toMatchObject({ name: 'Tarte Tatin', request: { params: { name: 'Tarte Tatin' } }, response: { status: 200 } });
        expect(proposals.every((p) => p.aiGenerated === true && p.reviewState === 'pending')).toBe(true);
        expect(new Set(proposals.map((p) => p.id)).size).toBe(3);
      });

      it('is deterministic: the same request gives the same proposals', async () => {
        const first = await copilot().suggestExamples('pastry2', 'get-list', { count: 2 });
        const second = await copilot().suggestExamples('pastry2', 'get-list', { count: 2 });
        expect(second).toEqual(first);
        expect(first.every((p) => p.request.params?.size !== undefined)).toBe(true);
      });

      it('proposes at least one example even when 0 is asked', async () => {
        expect(await copilot().suggestExamples('pastry2', 'get-name', { count: 0 })).toHaveLength(1);
      });

      it('derives generic samples from the dispatcher rule of other services', async () => {
        const proposals = await copilot().suggestExamples('beer', 'get-beer', { count: 2 });
        expect(proposals.map((p) => p.id)).toEqual(['ai-get-beer-1', 'ai-get-beer-2']);
        expect(proposals.every((p) => p.aiGenerated === true && p.reviewState === 'pending')).toBe(true);
      });
    });

    describe('CopilotExtensions.workflowContext', () => {
      it('finds the run of restock-pastry that lacks an example for "Tarte Tatin"', async () => {
        const context = await copilot().workflowContext('pastry2', 'Tarte Tatin');
        expect(context).toMatchObject({ documentId: 'pastry', workflowId: 'restock-pastry', operationId: 'get-name', criteria: 'name=Tarte Tatin' });
      });

      it('matches the hint case-insensitively and ignores surrounding spaces', async () => {
        expect(await copilot().workflowContext('pastry2', '  tarte tatin ')).toEqual(await copilot().workflowContext('pastry2', 'Tarte Tatin'));
      });

      it('returns undefined without hint, for an unknown hint or another service', async () => {
        expect(await copilot().workflowContext('pastry2')).toBeUndefined();
        expect(await copilot().workflowContext('pastry2', 'Kouign-amann')).toBeUndefined();
        expect(await copilot().workflowContext('beer', 'Tarte Tatin')).toBeUndefined();
      });
    });
  });
}
