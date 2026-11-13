<script lang="ts">
  import type { ExampleExpectation, WorkflowExample, WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import { DataTable, type DataTableColumn } from '@microcks/deep-ink';
  import Verdict from './Verdict.svelte';
  import { exampleJudging } from './run';

  interface Props {
    run: WorkflowRun;
    example: WorkflowExample;
    pending: boolean;
  }

  let { run, example, pending }: Props = $props();
  // While the run plays, the expectations wait for its end: every row is "Pending".
  const judging = $derived(exampleJudging(run, example, pending));
  const columns: DataTableColumn<ExampleExpectation>[] = [
    { key: 'kind', header: 'Expectation', rowHeader: true, nowrap: true, render: kindCell },
    { key: 'expected', header: 'Expected', mono: true, render: expectedCell },
    { key: 'got', header: 'This run', render: gotCell },
    { key: 'result', header: 'Result', render: resultCell },
  ];
</script>

{#snippet kindCell(r: ExampleExpectation)}<span class="wfr-example-kind">{r.kind}</span>{/snippet}
{#snippet expectedCell(r: ExampleExpectation)}<span class="wfr-mono-sm">{r.expected}</span>{/snippet}
{#snippet gotCell(r: ExampleExpectation)}<span class="wfr-mono-sm" data-tone={pending ? 'muted' : r.met ? undefined : 'danger'}>{r.got}</span>{/snippet}
{#snippet resultCell(r: ExampleExpectation)}{#if pending}<Verdict tone="muted" icon="dash">Pending</Verdict>{:else}<Verdict
      tone={r.met ? 'success' : 'danger'}
      icon={r.met ? 'check' : 'cross'}>{r.met ? 'Met' : 'Not met'}</Verdict
    >{/if}{/snippet}

<section aria-labelledby="wfr-ex-h" class="wfr-card wfr-example" data-result={pending ? 'pending' : judging.matches ? 'passed' : 'failed'}
  ><div class="wfr-example-head"
    ><h2 id="wfr-ex-h" class="wfr-example-title">Example <span class="wfr-example-name">{example.id}</span></h2
    ><span role="status"
      >{#if pending}<Verdict tone="muted" icon="running" size={14}>Judged once the run ends</Verdict>{:else}<Verdict
          tone={judging.matches ? 'success' : 'danger'}
          icon={judging.matches ? 'check' : 'cross'}
          size={14}>{judging.matches ? 'Matches the example' : 'Does not match the example'}</Verdict
        >{/if}</span
    ></div
  ><DataTable
    caption={`Expectations of the example ${example.id}`}
    captionHidden
    headerCase="sentence"
    density="compact"
    class="wfr-example-table"
    rowKey={(r) => `${r.kind} ${r.expected}`}
    rows={judging.rows}
    rowTone={(r) => (pending || r.met ? undefined : 'danger')}
    {columns}
  />{#if judging.unmet.length > 0}<ul aria-label="Unmet expectations" class="wfr-unmet">{#each judging.unmet as u (u)}<li>{u}</li>{/each}</ul>{/if}</section
>
