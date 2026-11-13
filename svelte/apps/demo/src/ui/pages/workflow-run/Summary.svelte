<script lang="ts">
  import { endLabel, stepsTally, stoppedStep, type Workflow, type WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import { formatDuration } from '@microcks/demo-core/domain/shared';
  import { DataTable, Facts, Icon, type DataTableColumn } from '@microcks/deep-ink';
  import { RouterLink } from '@/ui/app';
  import { workflowPath } from '@/ui/pages/workflows/paths';
  import StepsBand from './StepsBand.svelte';
  import { explanationOf, jsonText, noOutputsText, openOperationOf } from './run';
  import { copilotExamplePath } from './steps';

  interface Props {
    run: WorkflowRun;
    totals: { calls: number; ms: number };
    workflow?: Workflow;
  }

  type Output = [string, unknown];

  let { run, totals, workflow }: Props = $props();
  const passed = $derived(run.status === 'SUCCESS');
  const stopped = $derived(stoppedStep(run));
  const outputs = $derived(Object.entries(run.outputs) as Output[]);
  const workflowOutputs = $derived(new Map((workflow?.outputs ?? []).map((o) => [o.name, o.expression])));
  // "Open operation PATCH /pastries/{name}": the operation of the step where the run stopped (else the last that ran).
  const operation = $derived(openOperationOf(run, workflow));
  const facts = [
    { term: 'Duration', value: durationFact },
    { term: 'Calls', value: callsFact },
    { term: 'Steps', value: stepsFact },
  ];
  const columns: DataTableColumn<Output>[] = [
    { key: 'output', header: 'Output', render: outputCell },
    { key: 'expression', header: 'Runtime expression', render: expressionCell },
    { key: 'value', header: 'Value', render: valueCell },
  ];
</script>

{#snippet durationFact()}<span class="wfr-stat">{formatDuration(totals.ms)}</span>{/snippet}
{#snippet callsFact()}<span class="wfr-stat">{totals.calls}</span>{/snippet}
{#snippet stepsFact()}<span class="wfr-stat-text">{stepsTally(run)}</span>{/snippet}
{#snippet outputCell([name]: Output)}<span class="wfr-mono-strong">{name}</span>{/snippet}
{#snippet expressionCell([name]: Output)}<span class="wfr-mono-secondary">{workflowOutputs.get(name) ?? ''}</span>{/snippet}
{#snippet valueCell([, value]: Output)}<span class="wfr-mono-strong">{jsonText(value)}</span>{/snippet}

<section aria-label="Run summary" class="wfr-card wfr-summary" data-result={passed ? 'passed' : 'failed'}
  ><div class="wfr-summary-head"
    ><div class="wfr-summary-text"
      ><h2 class="wfr-verdict-title" id="wfr-verdict-h" tabindex="-1"
        ><Icon name={passed ? 'check' : 'cross'} size={20} stroke-width={2.6} />{passed ? 'Run passed' : 'Run failed'}</h2
      ><span class="wfr-summary-end">{endLabel(run)}</span><span class="wfr-summary-explain">{explanationOf(run, workflow)}</span></div
    ><Facts layout="columns" columns={3} gap="4px 24px" class="wfr-summary-facts" items={facts} /></div
  ><StepsBand {run} /><div class="wfr-block"
    ><h3 class="wfr-h3">Workflow outputs</h3
    >{#if outputs.length > 0}<DataTable
        caption="Workflow outputs"
        captionHidden
        headerCase="sentence"
        density="compact"
        class="wfr-outputs-table"
        rowKey={(r) => r[0]}
        rows={outputs}
        {columns}
      />{:else}<p class="wfr-muted">{noOutputsText(run)}</p>{/if}</div
  ><div class="wfr-actions"
    >{#if run.relatedTestRunId}<RouterLink to={`/tests/runner/${run.relatedTestRunId}`} class="wfr-action" data-tone="danger"
        ><Icon name="warning" size={14} stroke-width={2.4} class="wfr-action-icon" />Same bug in test run #<!---->{run.relatedTestRunId}</RouterLink
      >{/if}{#if run.coherence[0]}<RouterLink to={copilotExamplePath(run.coherence[0].copilotHint)} class="wfr-action" data-tone="action"
        ><Icon name="sparkles" size={14} class="wfr-action-icon" />Generate the example with the AI Copilot</RouterLink
      >{/if}{#if operation}<RouterLink to="/services/pastry2" class="wfr-action"
        >Open operation<span class="wfr-action-op">{operation.method}<!---->{' '}<!---->{operation.path}</span></RouterLink
      >{/if}<RouterLink
      to={workflowPath(run.documentId, run.workflowId, 'loom', { run: String(run.number), step: stopped?.stepId })}
      class="wfr-action">Back to workflow</RouterLink
    ></div
  ></section
>
