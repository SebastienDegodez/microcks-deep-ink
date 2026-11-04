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
    expect(props.tableToggle).toBe(false);
    expect(props.outputNote).toBe('No outputs: #14 failed.');
    expect(props.inputs).toEqual([{ name: 'size', value: '"M"' }, { name: 'newPrice', value: '3.9' }]);
    const [, get, patch, verify] = props.steps;
    expect(patch).toMatchObject({
      status: 'failed',
      attempts: 3,
      operation: 'PATCH /pastries/{name}',
      method: 'PATCH',
      path: '/pastries/{name}',
      result: '200 · 3 attempts · 185 ms',
      checks: { successCriteria: 'passed', schemaValidation: 'failed' },
      actions: [{ type: 'retry', retryAfter: 1, retryLimit: 2, applied: true, runLabel: '#14' }],
    });
    expect(get?.actions).toEqual([{ type: 'end', name: 'alreadyAvailable', on: 'success', criteria: "$response.body#/status == 'available'", label: "status == 'available'", taken: false, runLabel: '#14' }]);
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
    const restock = await load('restock-pastry', 14);
    const threads = threadsOf(restock.workflow, restock.run);
    expect(threads.map((t) => t.expression)).toEqual([
      '$inputs.size',
      '$steps.listPastries.outputs.firstName',
      '$inputs.newPrice',
      '$steps.getPastry.outputs.oldPrice',
      '$steps.patchPastry.outputs.newPrice',
    ]);
    expect(threads[1]).toMatchObject({
      from: 'listPastries',
      value: '"Eclair Cafe"',
      drops: [
        { to: 'getPastry', label: 'name · path' },
        { to: 'patchPastry', label: 'name · path' },
        { to: 'verifyPastry', label: 'name · path', idle: true },
        { to: '$outputs', label: 'pastryName', idle: true },
      ],
    });
    expect(threads[2]?.drops).toEqual([{ to: 'patchPastry', label: '/price · body' }]);
    expect(threads[4]).toMatchObject({ from: 'patchPastry', missing: true });
    const session = await load('restock-pastry', 13);
    expect(threadsOf(session.workflow, session.run)[1]?.drops[1]).toEqual({ to: 'patchPastry', label: 'name · path', bad: 'Millefeuille' });
  });

  it('traces where a value is produced and consumed (the expression lens)', async () => {
    const { workflow, run } = await load('restock-pastry', 14);
    const lens = lensOf('$steps.listPastries.outputs.firstName', workflow, run);
    expect(lens.value).toBe('"Eclair Cafe"');
    expect(lens.producedBy).toBe('listPastries · $response.body#/0/name');
    expect(lens.uses.map((u) => u.who)).toEqual(['2 · getPastry', '3 · patchPastry', '4 · verifyPastry', 'workflow output']);
    expect(lens.uses[2]).toMatchObject({ value: 'not run in #14', tone: 'idle' });
    expect(lensOf('$inputs.newPrice', workflow, run).uses[0]).toMatchObject({ who: '3 · patchPastry', what: 'requestBody replacement /price', value: '3.9' });
    expect(lensOf('$steps.patchPastry.outputs.newPrice', workflow, run).value).toBe('— (not produced: patchPastry failed)');
  });

  it('labels runs for the picker', async () => {
    const { runs } = await load('restock-pastry');
    expect(runs.slice(0, 4).map(runPickLabel)).toEqual(['#14 · Implementations', '#13 · Session', '#12 · Mocks · example', '#11 · Mock URL']);
  });
});
