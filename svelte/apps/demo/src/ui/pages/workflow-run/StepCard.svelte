<script lang="ts">
  import { formatDuration } from '@microcks/demo-core/domain/shared';
  import type { Step, StepResult, WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import { Chip, Icon, MethodTag, StatusBadge } from '@microcks/deep-ink';
  import StepBody from './StepBody.svelte';
  import { STEP_WORD, runningStepLabel, stepMsLabel, stepTags, type StepLook } from './steps';

  interface Props {
    index: number;
    step: StepResult;
    def?: Step;
    look: StepLook;
    run: WorkflowRun;
    offset: number;
    stop: string;
  }

  /** One step of the timeline: its head (a disclosure once it ended) and its request, response and checks. */
  let { index, step, def, look, run, offset, stop }: Props = $props();
  const bodyId = $props.id();
  const finished = $derived(look === 'pass' || look === 'fail');
  // Collapsed by the user, else open: a step that finishes while the run plays opens, as in the prototype.
  let collapsed = $state(false);
  const open = $derived(!collapsed);
  const showBody = $derived((finished && open) || look === 'run');
  const tags = $derived(stepTags(step, def, look));
  const msLabel = $derived(stepMsLabel(step, look));
</script>

{#snippet head()}<span class="wfr-step-id-group"
    ><span class="wfr-step-id">{step.stepId}</span
    >{#if def}<span class="wfr-step-op"><MethodTag method={def.method} size="sm" />{def.path}</span>{/if}{#if def}<span class="wfr-step-opid"
        >{def.operationId}</span
      >{/if}{#each tags as t (t.text)}<Chip size="sm" variant="outline" tone={t.tone}>{t.text}</Chip>{/each}</span
  >{#if finished || look === 'run'}<span class="wfr-step-at">at +<!---->{formatDuration(offset)}</span>{/if}<span class="wfr-step-ms"
    >{msLabel}</span
  >{#if look === 'run'}<StatusBadge shape="bare" status="running" class="wfr-step-run" label={runningStepLabel(run, def)} />{:else}<span
      class="wfr-step-status"
      data-look={look}
      ><Icon
        name={look === 'pass' ? 'check' : look === 'fail' ? 'cross' : 'circle'}
        size={14}
        stroke-width={look === 'pass' || look === 'fail' ? 2.6 : 2}
        stroke-dasharray={look === 'notrun' ? '3 3' : undefined}
      />{STEP_WORD[look]}</span
    >{/if}{/snippet}

<article class="wfr-step" data-look={look} aria-label={`Step ${index + 1} ${step.stepId}: ${STEP_WORD[look]}`}
  ><h3 class="wfr-step-h"
    >{#if finished}<button type="button" class="wfr-step-head" aria-expanded={open} aria-controls={bodyId} onclick={() => (collapsed = !collapsed)}
        >{@render head()}<Icon name="chevron" size={16} class="wfr-step-chevron" /></button
      >{:else}<span class="wfr-step-head">{@render head()}<span class="wfr-step-chevron-slot"></span></span>{/if}</h3
  >{#if look === 'notrun' || look === 'pend'}<p class="wfr-step-pend">{look === 'notrun' ? `Not run: ${stop}.` : 'Queued.'}</p>{/if}{#if showBody}<div
      class="wfr-step-body"
      id={bodyId}
      ><StepBody {step} {def} {run} running={look === 'run'} /></div
    >{/if}</article
>
