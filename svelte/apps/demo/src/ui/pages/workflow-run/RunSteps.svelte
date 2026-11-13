<script lang="ts">
  import { stepOffsets, type Workflow, type WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import { Icon } from '@microcks/deep-ink';
  import StepCard from './StepCard.svelte';
  import { stopText, threadSources, timelineRows, valueText } from './steps';

  interface Props {
    run: WorkflowRun;
    workflow?: Workflow;
  }

  /** The steps timeline: one card per step, and between two steps the baton of the values handed over. */
  let { run, workflow }: Props = $props();
  const offsets = $derived(stepOffsets(run));
  const sources = $derived(threadSources(workflow));
  const stop = $derived(stopText(run));
  const total = $derived(run.steps.length);
  const rows = $derived(timelineRows(run, workflow));
</script>

<section aria-labelledby="wfr-steps-h" class="wfr-steps-section"
  ><div class="wfr-steps-head"
    ><h2 id="wfr-steps-h" class="wfr-h2">Steps</h2
    ><span class="wfr-muted"
      >{total}<!----> steps on the<!---->{' '}<!---->{#if sources.length === 1}<span class="wfr-mono">{sources[0]}</span>{' thread'}{:else}{`${sources.length} threads`}{/if}<!---->{' '}<!---->· chips between steps show the values handed over</span
    ></div
  ><ol aria-label="Workflow steps" class="wfr-timeline"
    >{#each rows as row, i (row.step.stepId)}{#if row.handovers.length > 0 || row.skipped}<li class="wfr-tl-item" data-kind="baton"
          ><span class="wfr-rail" aria-hidden="true"><span class="wfr-rail-line" data-on={row.ready ? '' : undefined}></span></span
          ><div class="wfr-tl-body"
            >{#if row.skipped}<span class="wfr-baton-skip"><Icon name="dash" size={12} stroke-width={2.4} />Not handed over: <!---->{stop}</span
              >{:else if row.ready}<div class="wfr-baton"
                ><div class="wfr-baton-chips"
                  >{#each row.handovers as h (h.target)}<span class="wfr-baton-chip" title={h.expression}
                      ><span class="wfr-mono">{h.name}<!---->{' '}<span class="wfr-faint">=</span>{' '}<strong>{valueText(h.value)}</strong></span
                      ><Icon name="arrow-right" size={14} class="wfr-faint" /><span class="wfr-secondary">{h.target}</span></span
                    >{/each}</div
                ><span class="wfr-baton-from">from <!---->{row.handovers.map((h) => h.expression).join(' · ')}</span></div
              >{:else}<span class="wfr-baton-wait"
                ><span class="wfr-pulse-bar" aria-hidden="true"></span>waiting for <!---->{row.prev?.stepId}<!----> outputs</span
              >{/if}</div
          ></li
        >{/if}<li class="wfr-tl-item" data-kind="step"
        ><span class="wfr-rail" aria-hidden="true"
          ><span
            class="wfr-rail-top"
            data-on={row.ready || i === 0 ? '' : undefined}
            data-hidden={i === 0 && row.handovers.length === 0 ? '' : undefined}
          ></span
          ><span class="wfr-node" data-look={row.look}>{i + 1}</span
          ><span class="wfr-rail-line" data-on={row.lineOn ? '' : undefined} data-hidden={row.last ? '' : undefined}></span></span
        ><div class="wfr-tl-body" data-kind="step"
          ><StepCard index={i} step={row.step} def={row.def} look={row.look} {run} offset={offsets[i] ?? 0} {stop} /></div
        ></li
      >{/each}</ol
  ></section
>
