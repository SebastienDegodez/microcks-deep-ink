<script lang="ts">
  import '@microcks/demo-styles/pages/workflow/tabs/steps.css';
  import type { WorkflowDetail } from '@microcks/demo-core/application/arazzo';
  import type { WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import RunPicker from '../RunPicker.svelte';
  import StepsTable from '../StepsTable.svelte';
  import { originWord } from '../run-facts';

  /** The Steps tab: the accessible table that carries the same information as the Loom. */
  let { detail, runs, run, onpickrun, inspectLink }: { detail: WorkflowDetail; runs: WorkflowRun[]; run?: WorkflowRun; onpickrun: (n: number) => void; inspectLink: (stepId: string) => string } =
    $props();

  const workflow = $derived(detail.workflow);
  const declared = $derived(workflow.steps.some((s) => s.dependsOn?.length));
</script>

<section aria-labelledby="wf-steps-title" class="wf-steps-panel"
  ><div class="wf-steps-head"
    ><div class="wf-steps-title"
      ><h2 id="wf-steps-title">{workflow.steps.length}<!----> steps</h2
      ><span class="wf-steps-sub">{run ? `Results from run #${run.number} · ${originWord(run)}` : 'Definition only, no run selected'}</span></div
    ><RunPicker {runs} {run} onpick={onpickrun} label="Show results from a run" /></div
  ><StepsTable {workflow} document={detail.document} {run} loomLink={inspectLink} /><p class="wf-steps-foot"
    >Steps run in list order{#if declared}{', unless a step declares '}<code>dependsOn</code
      >{': then the independent steps run in parallel and join at the step that depends on them'}{/if}{'. An '}<code>onSuccess</code>{' '}<code>end</code
    >{' whose criteria hold ends the run early, with success. A failed step applies its first '}<code>onFailure</code
    >{' action whose criteria hold; when it still fails, the run ends and the later steps are not run. With "Validate each response against its OpenAPI schema" on, a response that does not conform to its schema fails the step even when its criteria hold.'}</p
  ></section
>
