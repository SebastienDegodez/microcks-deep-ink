<script lang="ts">
  import type { ArazzoDocument, Workflow, WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import { thumbnail } from './thumbnail';

  let { workflow, document, run }: { workflow: Workflow; document: ArazzoDocument; run?: WorkflowRun } = $props();
  const model = $derived(thumbnail(workflow, document, run));
</script>

<span role="img" aria-label={model.label} class="wf-loom-thumb" style:width={`${model.width}px`} style:height={`${model.height}px`}
  >{#each model.lanes as lane, i (i)}<span
      aria-hidden="true"
      class="wf-loom-lane"
      data-dashed={lane.dashed ? '' : undefined}
      data-disabled={model.disabled ? '' : undefined}
      style:top={`${lane.top}px`}
      style:width={`${lane.width}px`}
      style:--lane={lane.color}
    ></span>{/each}{#each model.links as link, i (i)}<span
      aria-hidden="true"
      class="wf-loom-link"
      style:left={`${link.left}px`}
      style:top={`${link.top}px`}
      style:height={`${link.height}px`}
    ></span>{/each}{#each model.dots as dot, i (i)}<span
      aria-hidden="true"
      class="wf-loom-dot"
      data-state={dot.state}
      style:left={`${dot.left}px`}
      style:top={`${dot.top}px`}
    ></span>{/each}</span
>
