<script lang="ts" module>
  import type { WorkflowTab } from '../workflows/paths';

  const TAB_LABELS: Record<WorkflowTab, string> = {
    loom: 'Loom',
    steps: 'Steps',
    source: 'Source',
    'mock-url': 'Mock URL',
    sessions: 'Sessions',
    examples: 'Examples',
    runs: 'Runs',
  };
</script>

<script lang="ts">
  import '@microcks/demo-styles/pages/workflows/workflows.css';
  import '@microcks/demo-styles/pages/workflow/workflow.css';
  import { stoppedStep } from '@microcks/demo-core/domain/arazzo';
  import { Callout, TabPanel, Tabs } from '@microcks/deep-ink';
  import { PageHeader, useNavigate, usePageTitle, useParams, useQuery, useSearchParams, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import { WORKFLOW_TABS, isWorkflowTab, workflowPath } from '../workflows/paths';
  import LastRunNote from './LastRunNote.svelte';
  import WorkflowHeader from './WorkflowHeader.svelte';
  import ExamplesTab from './tabs/ExamplesTab.svelte';
  import LoomTab from './tabs/LoomTab.svelte';
  import MockUrlTab from './tabs/MockUrlTab.svelte';
  import RunsTab from './tabs/RunsTab.svelte';
  import SessionsTab from './tabs/SessionsTab.svelte';
  import SourceTab from './tabs/SourceTab.svelte';
  import StepsTab from './tabs/StepsTab.svelte';

  const params = useParams();
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const uc = useUseCases();
  const docId = $derived(params.docId ?? '');
  const workflowId = $derived(params.workflowId ?? '');
  const tabParam = $derived(params.tab);
  const tab: WorkflowTab = $derived(isWorkflowTab(tabParam) ? tabParam : 'loom');

  const detail = useQuery(
    () => uc.arazzo.getWorkflow(docId, workflowId),
    () => [docId, workflowId],
  );
  const runs = useQuery(
    () => uc.arazzo.listRuns(docId, workflowId),
    () => [docId, workflowId],
  );
  const examples = useQuery(
    () => uc.arazzo.listExamples(docId, workflowId),
    () => [docId, workflowId],
  );
  const sessions = useQuery(
    () => uc.arazzo.listSessions(docId, workflowId),
    () => [docId, workflowId],
  );
  const catalog = useQuery(
    () => uc.catalog.listServices(),
    () => [],
  );

  usePageTitle(() => `${detail.data?.workflow.summary ?? (workflowId || 'Workflow')} · Microcks`);

  // A tab segment that is not a tab goes back to the Loom.
  $effect(() => {
    if (tabParam !== undefined && !isWorkflowTab(tabParam)) navigate(workflowPath(docId, workflowId, 'loom'), { replace: true });
  });

  const loadingAny = $derived(detail.status === 'loading' && !detail.data);
  const runList = $derived(runs.data ?? []);
  const selectedRun = $derived.by(() => {
    const runNumber = Number(search.get('run'));
    return runList.find((r) => r.number === runNumber) ?? runList[0];
  });
  const step = $derived(search.get('step') ?? undefined);
  const lastRun = $derived(runList[0]);

  const setQuery = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams(search.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined) params.delete(k);
      else params.set(k, v);
    }
    setSearch(params, { replace: true });
  };
  const inspectLink = (stepId: string) => workflowPath(docId, workflowId, 'loom', { run: selectedRun ? String(selectedRun.number) : undefined, step: stepId });
  const goTab = (id: string) => {
    if (!isWorkflowTab(id)) return;
    const query: Record<string, string | undefined> = {};
    if (selectedRun && (id === 'loom' || id === 'steps')) query.run = String(selectedRun.number);
    navigate(workflowPath(docId, workflowId, id, query));
  };
  const onpickrun = (n: number) => setQuery({ run: String(n) });
  const onselectstep = (s: string | undefined) => setQuery({ step: s });

  const serviceLabel = (id: string) => {
    const svc = (catalog.data ?? []).find((x) => x.id === id);
    return svc ? `${svc.name} ${svc.version}` : undefined;
  };
  const tabItems = $derived.by(() => {
    const d = detail.data;
    const counts: Partial<Record<WorkflowTab, number | undefined>> = {
      steps: d?.workflow.steps.length,
      sessions: sessions.data?.length || undefined,
      examples: examples.data?.length || undefined,
      // Runs are numbered per workflow: the latest number is the total.
      runs: lastRun?.number,
    };
    return WORKFLOW_TABS.map((id) => ({ id, label: TAB_LABELS[id], count: counts[id] }));
  });
  const sourceStep = $derived(step ?? (selectedRun?.status === 'FAILURE' ? stoppedStep(selectedRun)?.stepId : undefined));
</script>

{#if detail.status === 'error'}<PageHeader title="Workflow" /><ErrorBlock
    error={detail.error}
    onretry={detail.reload}
    title="This workflow could not be loaded"
  />{:else if loadingAny || !detail.data}<PageHeader title={workflowId} /><LoadingBlock label="the workflow" rows={5} />{:else}{@const d =
    detail.data}{@const asyncBlock = !d.workflow.runnability.runnable ? d.workflow.runnability : undefined}<div class="wf-workflow"
    ><WorkflowHeader document={d.document} workflow={d.workflow} runs={runList} {serviceLabel} onmockurl={() => goTab('mock-url')} />{#if asyncBlock}<Callout
        tone="warning"
        title="This workflow cannot run yet"><span id="wf-run-why">{asyncBlock.message}<!---->.</span></Callout
      >{/if}{#if lastRun}<LastRunNote document={d.document} workflow={d.workflow} run={lastRun} />{/if}<Tabs
      label="Workflow views"
      items={tabItems}
      value={tab}
      onchange={goTab}
      ><TabPanel id="loom" value={tab}
        ><LoomTab
          detail={d}
          runs={runList}
          run={selectedRun}
          {step}
          sessions={sessions.data}
          {serviceLabel}
          {onpickrun}
          {onselectstep}
          {inspectLink}
        /></TabPanel
      ><TabPanel id="steps" value={tab}><StepsTab detail={d} runs={runList} run={selectedRun} {onpickrun} {inspectLink} /></TabPanel><TabPanel
        id="source"
        value={tab}><SourceTab detail={d} step={sourceStep} {onselectstep} {serviceLabel} /></TabPanel
      ><TabPanel id="mock-url" value={tab}
        ><MockUrlTab detail={d} runs={runList} onshowruns={() => navigate(workflowPath(docId, workflowId, 'runs', { filter: 'mock-url' }))} /></TabPanel
      ><TabPanel id="sessions" value={tab}
        >{#if sessions.status === 'error'}<ErrorBlock error={sessions.error} onretry={sessions.reload} />{:else if sessions.data}<SessionsTab
            detail={d}
            sessions={sessions.data}
            runs={runList}
          />{:else}<LoadingBlock label="the sessions" rows={3} />{/if}</TabPanel
      ><TabPanel id="examples" value={tab}
        >{#if examples.status === 'error'}<ErrorBlock error={examples.error} onretry={examples.reload} />{:else if examples.data}<ExamplesTab
            detail={d}
            runs={runList}
            examples={examples.data}
            {serviceLabel}
          />{:else}<LoadingBlock label="the examples" rows={3} />{/if}</TabPanel
      ><TabPanel id="runs" value={tab}
        >{#if runs.status === 'error'}<ErrorBlock error={runs.error} onretry={runs.reload} />{:else}<RunsTab
            detail={d}
            runs={runList}
            sessions={sessions.data}
            initialFilter={search.get('filter') ?? undefined}
          />{/if}</TabPanel
      ></Tabs
    ></div
  >{/if}
