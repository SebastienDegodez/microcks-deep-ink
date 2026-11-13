<script lang="ts">
  import type { WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import { Icon } from '@microcks/deep-ink';
  import { stepsBand, stepsBandLabel } from './run';

  interface Props {
    run: WorkflowRun;
  }

  /** Upper bar = success criteria, lower bar = schema validation, one column per step. */
  let { run }: Props = $props();
  const band = $derived(stepsBand(run));
</script>

<div class="wfr-band-wrap"
  ><span class="wfr-band-legend">Steps band · upper bar = success criteria, lower bar = schema validation</span
  ><div class="wfr-band" role="img" aria-label={stepsBandLabel(band)}
    >{#each band as b (b.id)}<div class="wfr-band-step" data-status={b.status}
        ><span class="wfr-band-bar" data-part="criteria" data-state={b.criteria}></span><span
          class="wfr-band-bar"
          data-part="schema"
          data-state={b.schema}
        ></span><span class="wfr-band-id"
          ><Icon
            name={b.status === 'passed' ? 'check' : b.status === 'failed' ? 'cross' : 'circle'}
            size={12}
            stroke-width={b.status === 'not-run' ? 2 : 2.8}
            stroke-dasharray={b.status === 'not-run' ? '3 3' : undefined}
          /><span class="wfr-mono">{b.id}</span></span
        ><span class="wfr-band-word">{b.word}</span></div
      >{/each}</div
  ></div
>
