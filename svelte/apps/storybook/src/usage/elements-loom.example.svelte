<script lang="ts">
  import { WorkflowLoom } from '@microcks/deep-ink';
  import type { LoomSource, LoomStep, LoomThread } from '@microcks/deep-ink';
  const sources: LoomSource[] = [{ name: 'apiPastry', type: 'openapi', protocol: 'REST', linked: true, serviceLabel: 'API Pastry 2.0' }];
  const steps: LoomStep[] = [
    { stepId: 'getPastry', source: 'apiPastry', operation: 'GET /pastries/{name}', status: 'passed', result: '200 · 188 ms' },
    { stepId: 'patchPastry', source: 'apiPastry', operation: 'PATCH /pastries/{name}', status: 'passed', result: '200 · 95 ms' },
  ];
  const threads: LoomThread[] = [
    { id: 'name', from: '$inputs', expression: '$inputs.name', value: '"Millefeuille"', drops: [{ to: 'getPastry', label: 'name · path' }, { to: 'patchPastry', label: 'name · path' }] },
    { id: 'newPrice', from: '$inputs', expression: '$inputs.newPrice', value: '4.5', drops: [{ to: 'patchPastry', label: '/price · body' }] },
    { id: 'price', from: 'getPastry', expression: '$response.body#/price', value: '4.2', drops: [{ to: '$outputs', label: 'oldPrice' }] },
  ];
  let step = $state<string | undefined>('patchPastry');
</script>
<WorkflowLoom label="update-price, run #3" {sources} {steps} {threads} inputs={[{ name: 'name', value: '"Millefeuille"' }, { name: 'newPrice', value: '4.5' }]} outputs={[{ name: 'oldPrice', value: '4.2' }]} selectedStep={step} onstepselect={(detail: { stepId?: string }) => { step = detail.stepId; }} />
