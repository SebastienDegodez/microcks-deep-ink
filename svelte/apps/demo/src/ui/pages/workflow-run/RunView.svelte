<script lang="ts">
  import { untrack } from 'svelte';
  import { callTotals, runHeadline, type WorkflowExample, type WorkflowRun } from '@microcks/demo-core/domain/arazzo';
  import { formatClock, formatDuration } from '@microcks/demo-core/domain/shared';
  import { RUN_SCENARIOS, type RunScenario, type WorkflowDetail } from '@microcks/demo-core/application/arazzo';
  import { ApiBadge, Button, LiveIndicator, RunMeta, StatusBadge } from '@microcks/deep-ink';
  import { ButtonRouterLink, PageHeader, RouterLink, useRelativeTime } from '@/ui/app';
  import { runPath, runSetupPath, workflowPath } from '@/ui/pages/workflows/paths';
  import ExampleJudging from './ExampleJudging.svelte';
  import Progress from './Progress.svelte';
  import Properties from './Properties.svelte';
  import RunApiPanel from './RunApiPanel.svelte';
  import RunBadges from './RunBadges.svelte';
  import RunSteps from './RunSteps.svelte';
  import ScenarioBar from './ScenarioBar.svelte';
  import Summary from './Summary.svelte';
  import { runBreadcrumb } from './api';
  import { apiBodyOf, currentIndexOf, endAnnouncement, launchedBy, runningLabel, stepAnnouncement, targetLine } from './run';

  interface Props {
    run: WorkflowRun;
    paused: boolean;
    ontogglepause: () => void;
    onstepforward?: () => void;
    detail?: WorkflowDetail;
    example?: WorkflowExample;
  }

  let { run, paused, ontogglepause, onstepforward, detail, example }: Props = $props();
  const relative = useRelativeTime();
  const running = $derived(run.status === 'RUNNING');
  const headline = $derived(runHeadline(run));
  const totals = $derived(callTotals(run));
  const total = $derived(run.steps.length);
  const workflow = $derived(detail?.workflow);
  const documentLabel = $derived(detail ? `${detail.document.title} ${detail.document.version}` : undefined);
  const currentIndex = $derived(currentIndexOf(run));

  // Polite, not chatty: one sentence when the current step changes, one when the run ends.
  let message = $state('');
  let lastStep: string | undefined;
  const currentStepId = $derived(run.current?.stepId);
  $effect(() => {
    const isRunning = running;
    const stepId = currentStepId;
    const at = currentIndex;
    const count = total;
    const title = headline.title;
    const detailText = headline.detail;
    if (isRunning && stepId) {
      if (lastStep !== stepId) {
        lastStep = stepId;
        message = stepAnnouncement(at, count, stepId);
      }
    } else if (!isRunning && lastStep !== '__done') {
      lastStep = '__done';
      message = endAnnouncement(title, detailText);
    }
  });

  // When the live run ends, its Pause / Skip buttons go away: move focus to the verdict instead of losing it.
  // The primary action (Skip to result, then Run again) stays the same element, as in the reference app, so the
  // focus it holds survives the end of the run.
  let wasRunning = untrack(() => running);
  $effect(() => {
    const isRunning = running;
    if (wasRunning && !isRunning) {
      const active = document.activeElement;
      if (!active || active === document.body) document.getElementById('wfr-verdict-h')?.focus();
    }
    wasRunning = isRunning;
  });

  const workflowTo = $derived(workflowPath(run.documentId, run.workflowId));
  const runsTo = $derived(workflowPath(run.documentId, run.workflowId, 'runs'));
  const passed = $derived(run.status === 'SUCCESS');
  const isScenarioWorkflow = $derived(run.workflowId === 'restock-pastry' && run.documentId === 'pastry');
  const scenario = $derived((Object.keys(RUN_SCENARIOS) as RunScenario[]).find((k) => RUN_SCENARIOS[k].runId === run.id));
  const metaItems = $derived([
    ...(detail ? [{ term: 'Document', kind: 'url' as const, value: documentLink }] : []),
    { term: 'Run against', value: targetLine(run) },
    { term: 'Started', value: relative(run.startedAt), detail: formatClock(run.startedAt) },
    { term: running ? 'Elapsed' : 'Duration', kind: 'mono' as const, value: formatDuration(totals.ms) },
    { term: 'Launched by', value: launchedBy(run) },
  ]);
</script>

{#snippet chip()}{#if running}<span class="wfr-running"
      ><LiveIndicator {paused} /><StatusBadge shape="bare" status="running" role="status" label={runningLabel(run, currentIndex)} /></span
    >{:else}<ApiBadge label="result" value={passed ? 'passed' : 'failed'} status={passed ? 'success' : 'danger'} icon={passed ? 'check' : 'close-sm'} />{/if}{/snippet}

{#snippet badge()}<RunBadges workflowId={run.workflowId} {documentLabel} to={workflowTo} {chip} />{/snippet}

{#snippet actions()}{#if running}<Button onclick={ontogglepause} aria-pressed={paused} icon={paused ? 'play' : 'pause'}
      >{paused ? 'Resume' : 'Pause'}<!----> updates</Button
    >{:else}<ButtonRouterLink to={runPath(run.id, true)} icon="reset">Replay live</ButtonRouterLink>{/if}<ButtonRouterLink
    to={running ? runPath(run.id) : runSetupPath(run.documentId, run.workflowId, scenario)}
    variant="primary"
    icon={running ? 'skip' : 'play'}>{running ? 'Skip to result' : 'Run again'}</ButtonRouterLink
  >{/snippet}

{#snippet documentLink()}<RouterLink to={workflowPath(run.documentId, run.workflowId, 'source')} class="wfr-meta-file">{detail?.document.file}</RouterLink
  >{/snippet}

<PageHeader
  title={`Run #${run.number}`}
  breadcrumb={runBreadcrumb(detail ? `${detail.document.title} - ${detail.document.version}` : undefined, workflowTo, runsTo, `Run #${run.number}`)}
  {badge}
  align="start"
  {actions}
  ><RunMeta class="wfr-run-meta" items={metaItems} /></PageHeader
><p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{message}</p
>{#if isScenarioWorkflow}<ScenarioBar {run} />{/if}<div class="wfr-layout"
  ><div class="wfr-main"
    >{#if running}<Progress {run} {workflow} {currentIndex} validated={run.options.validateSchemas} {paused} {onstepforward} />{:else}<Summary
        {run}
        {totals}
        {workflow}
      />{/if}{#if example}<ExampleJudging {run} {example} pending={running} />{/if}<RunSteps {run} {workflow} /></div
  ><aside aria-label="Run side panels" class="wfr-aside"
    ><Properties {run} {detail} {example} />{#if detail && workflow}<RunApiPanel
        hint={`Launches the same run as run #${run.number}.`}
        documentApiId={detail.document.apiId}
        documentLabel={documentLabel ?? ''}
        workflowId={run.workflowId}
        mockUrl={workflow.mockUrl}
        mixed={run.target.kind === 'mixed'}
        body={apiBodyOf(run)}
      />{/if}</aside
  ></div
>
