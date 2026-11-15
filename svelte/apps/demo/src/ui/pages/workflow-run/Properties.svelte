<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { WorkflowExample, WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import type { WorkflowDetail } from '@microcks/demo-core/application/arazzo';
  import { Chip, Facts } from '@microcks/deep-ink';
  import { RouterLink } from '@/ui/app';
  import { workflowPath } from '@/ui/pages/workflows/paths';
  import { implementationsText } from './api';
  import { exampleVerdict, inputsText, mockSources, originText, outputsText, targetKindLabel } from './run';

  interface Props {
    run: WorkflowRun;
    detail?: WorkflowDetail;
    example?: WorkflowExample;
  }

  let { run, detail, example }: Props = $props();
  const onMocks = $derived(run.target.kind === 'mocks');
  const firstBaggage = $derived(run.steps.find((s) => s.status !== 'not-run')?.baggage);
  const outputs = $derived(Object.entries(run.outputs));
  const verdict = $derived(exampleVerdict(run, example));
  const rows = $derived<{ term: string; value: string | Snippet }[]>([
    { term: 'Workflow', value: workflowFact },
    { term: 'Target', value: targetFact },
    { term: 'Secret', value: secretFact },
    { term: 'Inputs', value: inputsFact },
    { term: 'Schema validation', value: run.options.validateSchemas ? 'On' : 'Off' },
    { term: 'Timeout per step', value: timeoutFact },
    ...(onMocks && firstBaggage ? [{ term: 'Baggage', value: baggageFact }] : []),
    ...(outputs.length > 0 ? [{ term: 'Outputs', value: outputsFact }] : []),
    ...(run.options.example ? [{ term: 'Example', value: exampleFact }] : []),
    { term: 'Origin', value: originText(run) },
  ]);
</script>

{#snippet workflowFact()}<RouterLink to={workflowPath(run.documentId, run.workflowId)} class="wfr-link-mono">{run.workflowId}</RouterLink
  >{' '}<!---->in <!---->{detail ? `${detail.document.title} ${detail.document.version}` : run.documentId}{/snippet}
{#snippet targetFact()}<span class="wfr-target"
    ><strong>{targetKindLabel(run)}</strong
    >{#if run.target.kind === 'implementations'}<span class="wfr-target-url">{implementationsText(run.target.baseUrls)}</span
      >{/if}{#if run.target.kind === 'mocks'}<span class="wfr-target-url">{mockSources(run)}</span>{/if}{#if run.target.kind === 'mixed'}<Chip
        size="sm"
        variant="dashed"
        tone="warning"
        class="wfr-proposed">Proposed · beyond POC</Chip
      >{/if}</span
  >{/snippet}
{#snippet secretFact()}<span class="wfr-mono-sm">{!onMocks && run.options.secret ? run.options.secret : 'None'}</span>{/snippet}
{#snippet inputsFact()}<span class="wfr-mono-sm">{inputsText(run)}</span>{/snippet}
{#snippet timeoutFact()}<span class="wfr-mono-sm">{run.options.timeoutMs}<!----> ms</span>{/snippet}
{#snippet baggageFact()}<span class="wfr-baggage-block"
    ><code class="wfr-baggage">{firstBaggage}</code><span class="wfr-note"
      >Carried by each call to the mocks: Live traces show which run, step and attempt a mock call comes from.</span
    ><RouterLink to={`/traces?run=${run.id}`} class="wfr-link">See in Live traces</RouterLink></span
  >{/snippet}
{#snippet outputsFact()}<span class="wfr-mono-sm">{outputsText(run)}</span>{/snippet}
{#snippet exampleFact()}<span class="wfr-mono-sm">{run.options.example}</span>{#if verdict}{` · ${verdict}`}{/if}{/snippet}

<section aria-labelledby="wfr-props-h" class="wfr-card wfr-props"
  ><h2 id="wfr-props-h" class="wfr-card-title">Properties</h2
  ><Facts layout="inline" termWidth="92px" gap="9px 12px" items={rows} /></section
>
