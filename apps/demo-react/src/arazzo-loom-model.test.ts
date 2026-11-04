import { describe, expect, it } from 'vitest';
import { createUseCases } from '@/composition-root';
import { buildLoomProps, effectiveDependencies, lensOf, runPickLabel, threadsOf } from '@/ui/pages/workflow/loom-model';

async function load(wf = 'restock-pastry', runNumber?: number) {
  const uc = createUseCases();
  const { document, workflow } = await uc.arazzo.getWorkflow('pastry', wf);
  const runs = await uc.arazzo.listRuns('pastry', wf);
  return { document, workflow, run: runNumber ? runs.find((r) => r.number === runNumber) : undefined, runs };
}

describe('loom model', () => {
  it('maps run #14 onto the loom: retry applied, end not taken, verifyPastry not run, both checks', async () => {
    const { workflow, document, run } = await load('restock-pastry', 14);
    const props = buildLoomProps(workflow, document, run, 'patchPastry');
    expect(props.validatesSchemas).toBe(true);
    expect(props.selectedStep).toBe('patchPastry');
    expect(props.sources).toEqual([{ name: 'apiPastry', type: 'openapi', protocol: 'REST', linked: true }]);
    const [, get, patch, verify] = props.steps;
    expect(patch).toMatchObject({
      status: 'failed',
      attempts: 3,
      operation: 'PATCH /pastries/{name}',
      checks: { successCriteria: 'passed', schemaValidation: 'failed' },
      actions: [{ type: 'retry', retryAfter: 1, retryLimit: 2, applied: true }],
    });
    expect(get?.actions).toEqual([{ type: 'end', name: 'alreadyAvailable', on: 'success', criteria: "$response.body#/status == 'available'", taken: false }]);
    expect(verify).toMatchObject({ status: 'not-run', checks: { successCriteria: 'not-evaluated', schemaValidation: 'not-evaluated' } });
    expect(JSON.stringify(props)).not.toContain('goto');
  });

  it('shows the definition only without a run, and keeps the dependsOn branches of check-menu', async () => {
    const { workflow, document } = await load('check-menu');
    const props = buildLoomProps(workflow, document, undefined, undefined);
    expect(props.steps.every((s) => s.status === undefined)).toBe(true);
    expect(props.steps[3]?.dependsOn).toEqual(['listSmall', 'listMedium', 'listLarge']);
    expect(effectiveDependencies(workflow.steps)).toEqual([[], [], [], ['listSmall', 'listMedium', 'listLarge']]);
  });

  it('marks a source that is not linked, and derives threads from the expressions', async () => {
    const uc = createUseCases();
    const { document, workflow } = await uc.arazzo.getWorkflow('beer', 'checkout-beer');
    expect(buildLoomProps(workflow, document, undefined, undefined).sources[0]).toMatchObject({ name: 'beerCatalog', linked: false });
    const restock = await load('restock-pastry');
    const threads = threadsOf(restock.workflow);
    expect(threads).toContainEqual({ from: 'listPastries', to: 'getPastry', expression: '$steps.listPastries.outputs.firstName' });
    expect(threads).toContainEqual({ from: '$inputs', to: 'listPastries', expression: '$inputs.size' });
    expect(threads).toContainEqual({ from: 'patchPastry', to: '$outputs', expression: '$steps.patchPastry.outputs.newPrice' });
  });

  it('traces where a value is produced and consumed (the expression lens)', async () => {
    const { workflow, run } = await load('restock-pastry', 14);
    const lens = lensOf('$steps.listPastries.outputs.firstName', workflow, run);
    expect(lens.value).toBe('"Eclair Cafe"');
    expect(lens.producedBy).toBe('Step 1, listPastries, output firstName');
    expect(lens.uses.map((u) => u.who)).toEqual(['Step 2, getPastry', 'Step 3, patchPastry', 'Step 4, verifyPastry', 'Workflow outputs']);
    expect(lensOf('$inputs.newPrice', workflow, run).uses[0]).toMatchObject({ who: 'Step 3, patchPastry', what: 'requestBody', value: '3.9' });
  });

  it('labels runs for the picker', async () => {
    const { runs } = await load('restock-pastry');
    expect(runs.slice(0, 4).map(runPickLabel)).toEqual(['#14 · Implementations', '#13 · Session', '#12 · Mocks', '#11 · Mock URL']);
  });
});
