<script lang="ts" module>
  import type { Action, ArazzoDocument, Step, Workflow, WorkflowRun } from '@microcks/demo-core/domain/arazzo';

  interface Row {
    n: number;
    step: Step;
    depends: string[];
  }

  const describe = (a: Action) => (a.type === 'retry' ? `retry every ${a.retryAfter} s, up to ${a.retryLimit} ${a.retryLimit === 1 ? 'time' : 'times'}` : 'end the workflow');
</script>

<script lang="ts">
  import { criteriaText } from '@microcks/demo-core/domain/arazzo';
  import { DataTable, Icon, MethodTag, type DataTableColumn } from '@microcks/deep-ink';
  import { ButtonRouterLink, RouterLink } from '@/ui/app';
  import { STATUS_ICON } from '@/ui/app/outcomes';
  import { effectiveDependencies, stepResultLine } from './loom-model';
  import { stepChecksOf, stepStatusOf } from './run-facts';

  /**
   * The Steps table: the accessible equivalent of the Loom (n°, stepId, Operation, Success criteria, Actions,
   * Outputs, Result in the selected run, On the loom). dependsOn is shown only when a step declares it.
   */
  let { workflow, document, run, loomLink }: { workflow: Workflow; document: ArazzoDocument; run?: WorkflowRun; loomLink?: (stepId: string) => string } = $props();

  /** The actions of a step in words, as the Steps table writes them. */
  function actionTexts(step: Step): { text: string; muted?: boolean }[] {
    const out = [
      ...step.onSuccess.map((a) => ({ text: `On success: ${describe(a)}${a.criteria?.length ? ` when ${criteriaText(a.criteria)}` : ''}` })),
      ...step.onFailure.map((a) => ({ text: `On failure: ${describe(a)}${a.criteria?.length ? ` when ${criteriaText(a.criteria)}` : ''}` })),
    ];
    return out.length ? out : [{ text: 'Next step · ends the run on failure', muted: true }];
  }

  const declared = $derived(workflow.steps.some((s) => s.dependsOn?.length));
  const rows: Row[] = $derived.by(() => {
    const deps = effectiveDependencies(workflow.steps);
    return workflow.steps.map((step, i) => ({ n: i + 1, step, depends: deps[i] ?? [] }));
  });
  const opRef = (step: Step) => `$sourceDescriptions.${step.sourceName}.${step.operationId}`;
  const linkOf = (step: Step) => {
    const src = document.sources.find((s) => s.name === step.sourceName);
    return { src, link: src?.link.status === 'linked' ? src.link : undefined };
  };

  const columns: DataTableColumn<Row>[] = $derived([
    { key: 'n', header: 'n°', mono: true, render: nCell },
    { key: 'step', header: 'stepId', render: stepCell },
    { key: 'op', header: 'Operation', render: opCell },
    { key: 'criteria', header: 'Success criteria', render: criteriaCell },
    { key: 'actions', header: 'Actions', render: actionsCell },
    { key: 'outputs', header: 'Outputs', render: outputsCell },
    { key: 'result', header: run ? `Result in #${run.number}` : 'Result', render: resultCell },
    ...(loomLink ? [{ key: 'inspect', header: 'Inspect', headerHidden: true, align: 'end' as const, render: inspectCell }] : []),
  ]);

  const rowTone = (r: Row) => {
    const st = run?.steps.find((x) => x.stepId === r.step.stepId)?.status;
    return st === 'failed' ? 'failed' : st === 'not-run' ? 'idle' : undefined;
  };
</script>

{#snippet nCell(r: Row)}<span class="wf-st-strong">{r.n}</span>{/snippet}

{#snippet stepCell(r: Row)}<span class="wf-st-stack"
    ><span class="wf-st-id">{r.step.stepId}</span><span class="wf-st-desc">{r.step.description}</span
    >{#if declared}<span class="wf-st-desc">dependsOn: <!---->{r.depends.length ? r.depends.join(', ') : 'none, starts at once'}</span>{/if}</span
  >{/snippet}

{#snippet opCell(r: Row)}{@const l = linkOf(r.step)}<span class="wf-st-stack"
    ><span class="wf-st-op"
      ><MethodTag size="xs" method={r.step.method} protocol={l.link?.protocol ?? (l.src?.type === 'asyncapi' ? 'EVENT' : 'REST')} />{#if l.link}<RouterLink
          to={`/services/${l.link.serviceId}`}
          class="wf-st-path">{r.step.path}</RouterLink
        >{:else}<span class="wf-st-path">{r.step.path}</span>{/if}</span
    ><span class="wf-st-opref">{opRef(r.step)}</span></span
  >{/snippet}

{#snippet criteriaCell(r: Row)}<span class="wf-st-stack"
    >{#each r.step.successCriteria as c (c.condition)}<span class="wf-st-crit"
        >{c.condition}{#if c.type === 'regex'}<span class="wf-st-muted">{' (regex on '}<!---->{c.context}<!---->)</span>{/if}</span
      >{/each}</span
  >{/snippet}

{#snippet actionsCell(r: Row)}<span class="wf-st-stack"
    >{#each actionTexts(r.step) as a (a.text)}<span class="wf-st-act" data-muted={a.muted ? '' : undefined}>{a.text}</span>{/each}</span
  >{/snippet}

{#snippet outputsCell(r: Row)}<span class="wf-st-outs">{r.step.outputs.length ? r.step.outputs.map((o) => o.name).join(', ') : '—'}</span>{/snippet}

{#snippet resultCell(r: Row)}{#if !run}<span class="wf-st-muted">No run selected</span>{:else}{@const result = run.steps.find((x) => x.stepId === r.step.stepId)}{@const status =
      stepStatusOf(result)}<span class="wf-st-stack"
      ><span class="wf-st-status" data-tone={status.tone}><Icon name={STATUS_ICON[status.tone]} size={13} stroke-width={2.2} />{status.word}</span
      >{#each stepChecksOf(result, run) as c (c.label)}<span class="wf-st-check"
          ><Icon name={STATUS_ICON[c.tone]} size={12} stroke-width={2.2} data-tone={c.tone} />{c.label}<!---->{' '}<span data-tone={c.tone}>{c.word}</span></span
        >{/each}{#if result && result.status !== 'not-run'}<span class="wf-st-res">{stepResultLine(result)}</span>{/if}</span
    >{/if}{/snippet}

{#snippet inspectCell(r: Row)}<ButtonRouterLink size="sm" class="wf-st-inspect" to={loomLink?.(r.step.stepId) ?? ''} aria-label={`Show ${r.step.stepId} on the loom`}
    >On the loom</ButtonRouterLink
  >{/snippet}

<div class="wf-st-scroll"
  ><DataTable
    caption={`${workflow.steps.length} steps of ${workflow.workflowId}${run ? `, results of run #${run.number}` : ', definition only'}`}
    captionHidden
    headerCase="sentence"
    {rowTone}
    {columns}
    {rows}
    rowKey={(r) => r.step.stepId}
  /></div
>
