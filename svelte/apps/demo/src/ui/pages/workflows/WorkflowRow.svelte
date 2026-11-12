<script lang="ts">
  import { runOutcome, type RunKindFilter } from '@microcks/demo-core/domain/arazzo';
  import type { WorkflowListItem } from '@microcks/demo-core/application/arazzo';
  import { ApiBadge, Button, Icon } from '@microcks/deep-ink';
  import { ButtonRouterLink, RouterLink } from '@/ui/app';
  import LoomThumb from './LoomThumb.svelte';
  import { runNote, targetLabel, TARGET_LABEL } from './listing';
  import { runPath, runSetupPath, workflowPath } from './paths';
  import { sourceColor } from './thumbnail';

  interface Props {
    row: WorkflowListItem;
    serviceName: (id: string) => { name: string; version: string } | undefined;
    relative: (date: string) => string;
    runKind: RunKindFilter;
  }
  let { row, serviceName, relative, runKind }: Props = $props();
  const workflow = $derived(row.workflow);
  const document = $derived(row.document);
  const lastRun = $derived(row.lastRun);
  const lastMockUrlRun = $derived(row.lastMockUrlRun);
  const runnable = $derived(workflow.runnability.runnable);
  const reason = $derived(workflow.runnability.runnable ? undefined : workflow.runnability.reason);
  const message = $derived(workflow.runnability.runnable ? '' : workflow.runnability.message);
  const reasonId = $derived(`wf-reason-${workflow.workflowId}`);
  const names = $derived([...new Set(workflow.steps.map((s) => s.sourceName))]);
  const unlinkedNames = $derived(names.filter((n) => !sourceColor(document, n).linked));
  const outcome = $derived(lastRun ? runOutcome(lastRun) : 'never');
  const shown = $derived(outcome === 'running' ? 'never' : outcome);
  const note = $derived(lastRun ? runNote(lastRun) : '');
</script>

<div role="row" class="wf-wrow"
  ><div role="cell" class="wf-cell wf-cell-workflow"
    ><RouterLink to={workflowPath(document.id, workflow.workflowId)} class="wf-badge-link wf-name-link"
      ><ApiBadge arazzo name={workflow.summary} version={document.version} class="wf-name-badge" /></RouterLink
    ><div class="wf-cell-line"
      ><code class="wf-id">{workflow.workflowId}</code>{#if reason === 'asyncapi-steps'}<span class="wf-tag" data-border="strong">AsyncAPI steps · Arazzo 1.1</span>{/if}{#if !runnable}<span class="wf-block"
          ><Icon name="ban" size={11} stroke-width={2.4} />{reason === 'asyncapi-steps' ? 'Cannot run yet: AsyncAPI steps' : 'Not linked'}</span
        >{/if}</div
    >{#if !runnable}<span class="wf-note">{message}</span>{/if}</div
  ><div role="cell" class="wf-cell wf-cell-steps"
    ><LoomThumb {workflow} {document} run={lastRun} /><span class="wf-steps-text"
      >{workflow.steps.length}<!----> steps<!---->{workflow.steps.some((s) => s.dependsOn?.length) ? ' · dependsOn' : ''}</span
    ></div
  ><div role="cell" class="wf-cell wf-cell-sources"
    >{#each names as n (n)}{@const lane = sourceColor(document, n)}{@const src = document.sources.find((s) => s.name === n)}{@const svc = src?.link.status === 'linked' ? serviceName(src.link.serviceId) : undefined}<span class="wf-src-tag" data-linked={lane.linked ? '' : undefined}
        >{#if lane.linked}<span aria-hidden="true" class="wf-swatch" style:background={lane.color}></span>{:else}<Icon name="warning" size={11} stroke-width={2.6} class="wf-warning-icon" />{/if}{n}<span class="sr-only"
          >{lane.linked ? (svc ? ` (linked to ${svc.name} ${svc.version})` : '') : ' (not linked)'}</span
        ></span
      >{/each}</div
  ><div
    role="cell"
    class="wf-cell wf-cell-inputs"
    aria-label={workflow.inputs.length ? `${workflow.inputs.length} inputs: ${workflow.inputs.map((i) => i.name).join(', ')}` : 'No input'}
    ><span aria-hidden="true" class="wf-inputs-count">{workflow.inputs.length}</span><span aria-hidden="true" class="wf-inputs-names"
      >{workflow.inputs.length ? workflow.inputs.map((i) => i.name).join(' ') : 'none'}</span
    ></div
  ><div role="cell" class="wf-cell wf-cell-last"
    ><span class="wf-cell-line"
      ><span class="wf-result-word" data-result={shown}
        ><Icon name={shown === 'passed' ? 'check-circle' : shown === 'failed' ? 'x-circle' : 'never-tested'} size={15} stroke-width={shown === 'never' ? 2 : 2.2} />{shown === 'passed' ? 'Passed' : shown === 'failed' ? 'Failed' : 'Never run'}</span
      >{#if lastRun}<span class="wf-tag">{targetLabel(lastRun)}</span>{/if}</span
    >{#if lastRun}<RouterLink
        to={runPath(lastRun.id)}
        class="wf-mono-link"
        aria-label={`#${lastRun.number} · ${relative(lastRun.startedAt)}, open run of ${workflow.workflowId}, ${targetLabel(lastRun)}, ${shown === 'passed' ? 'Passed' : 'Failed'}`}
        >#<!---->{lastRun.number}<!----> · <!---->{relative(lastRun.startedAt)}</RouterLink
      >{#if note}<span class="wf-run-note">{note}</span>{/if}{:else}<span class="wf-note"
        >{!runnable ? 'Run disabled' : runKind === 'any' ? 'no run yet' : `no run with ${TARGET_LABEL[runKind]}`}</span
      >{/if}</div
  ><div role="cell" class="wf-cell wf-cell-mock"
    ><span class="wf-mock-state" data-ready={runnable ? '' : undefined}
      ><Icon name={runnable ? 'link' : 'never-tested'} size={15} />{runnable ? 'Ready' : 'Not available'}</span
    >{#if runnable}<RouterLink to={workflowPath(document.id, workflow.workflowId, 'mock-url')} title={`POST ${workflow.mockUrl}`} class="wf-mono-link wf-mock-path"
        >POST …/<!---->{document.version}<!---->/<!---->{workflow.workflowId}</RouterLink
      >{/if}<span class="wf-note"
      >{!runnable
        ? reason === 'asyncapi-steps' ? 'AsyncAPI steps cannot be played yet' : `Link ${unlinkedNames.join(', ') || 'its sources'} first`
        : lastMockUrlRun ? `Last call ${relative(lastMockUrlRun.startedAt)} (run #${lastMockUrlRun.number})` : 'Never called'}</span
    ></div
  ><div role="cell" class="wf-cell-run"
    >{#if runnable}<ButtonRouterLink to={runSetupPath(document.id, workflow.workflowId)} variant="secondary" size="sm" icon="play"
        >Run<span class="sr-only">{' '}<!---->{workflow.workflowId}</span></ButtonRouterLink
      >{:else}<Button size="sm" disabled icon="play" title={message} aria-describedby={reasonId} class="wf-run-disabled"
        >Run<span class="sr-only">{' '}<!---->{workflow.workflowId}</span></Button
      ><span id={reasonId} class="sr-only">{message}</span>{/if}</div
  ></div
>
