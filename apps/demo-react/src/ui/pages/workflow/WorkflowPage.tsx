import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { runHeadline, stoppedStep } from '@/domain/arazzo';
import { PageHeader, useQuery, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Menu } from '@/ui/components/ui/menu';
import { TabPanel, Tabs } from '@/ui/components/ui/tabs';
import { ErrorBlock, LoadingBlock, WORKFLOW_TABS, isWorkflowTab, runPath, runSetupPath, workflowPath, type WorkflowTab } from '../workflows/shared';
import '../workflows/workflows.css';
import { LoomTab } from './tabs/LoomTab';
import { StepsTab } from './tabs/StepsTab';
import { SourceTab } from './tabs/SourceTab';
import { MockUrlTab } from './tabs/MockUrlTab';
import { SessionsTab } from './tabs/SessionsTab';
import { ExamplesTab } from './tabs/ExamplesTab';
import { RunsTab } from './tabs/RunsTab';

const TAB_LABELS: Record<WorkflowTab, string> = {
  loom: 'Loom',
  steps: 'Steps',
  source: 'Source',
  'mock-url': 'Mock URL',
  sessions: 'Sessions',
  examples: 'Examples',
  runs: 'Runs',
};

export default function WorkflowPage() {
  const { docId = '', workflowId = '', tab: tabParam } = useParams();
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const uc = useUseCases();
  const tab: WorkflowTab = isWorkflowTab(tabParam) ? tabParam : 'loom';

  const detail = useQuery(() => uc.arazzo.getWorkflow(docId, workflowId), [docId, workflowId]);
  const runs = useQuery(() => uc.arazzo.listRuns(docId, workflowId), [docId, workflowId]);
  const examples = useQuery(() => uc.arazzo.listExamples(docId, workflowId), [docId, workflowId]);
  const sessions = useQuery(() => uc.arazzo.listSessions(docId, workflowId), [docId, workflowId]);

  usePageTitle(`${workflowId ? titleOf(workflowId) : 'Workflow'} · Microcks`);

  // A tab segment that is not a tab goes back to the Loom.
  useEffect(() => {
    if (tabParam !== undefined && !isWorkflowTab(tabParam)) navigate(workflowPath(docId, workflowId, 'loom'), { replace: true });
  }, [tabParam, docId, workflowId, navigate]);

  const loadingAny = detail.status === 'loading' && !detail.data;
  if (detail.status === 'error') {
    return (
      <>
        <PageHeader title="Workflow" />
        <ErrorBlock error={detail.error} onRetry={detail.reload} title="This workflow could not be loaded" />
      </>
    );
  }
  if (loadingAny || !detail.data) {
    return (
      <>
        <PageHeader title={titleOf(workflowId)} />
        <LoadingBlock label="Loading the workflow" rows={5} />
      </>
    );
  }

  const { workflow, document } = detail.data;
  const runList = runs.data ?? [];
  const runNumber = Number(search.get('run'));
  const selectedRun = runList.find((r) => r.number === runNumber) ?? runList[0];
  const step = search.get('step') ?? undefined;
  const lastRun = runList[0];
  const stopped = lastRun?.status === 'FAILURE' ? stoppedStep(lastRun) : undefined;
  const canRun = workflow.runnability.runnable;

  const setQuery = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams(search);
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
  const onPickRun = (n: number) => setQuery({ run: String(n) });
  const reloadAll = () => {
    runs.reload();
    sessions.reload();
  };

  const asyncBlock = !workflow.runnability.runnable ? workflow.runnability : undefined;

  return (
    <>
      <PageHeader
        title={workflow.workflowId}
        breadcrumb={[{ label: 'Workflows', to: '/workflows' }, { label: document.file }]}
        badge={<ApiBadge arazzo name="workflow" />}
        actions={
          <>
            {canRun ? (
              <Button variant="primary" icon="play" onClick={() => navigate(runSetupPath(docId, workflowId))}>
                Run
              </Button>
            ) : (
              <Button variant="primary" icon="play" disabled aria-describedby="wf-run-why">
                Run
              </Button>
            )}
            <Menu
              label="More actions"
              iconOnly
              icon="more"
              align="end"
              items={[
                { id: 'copy', label: 'Copy workflowId', onSelect: () => void navigator.clipboard?.writeText(workflow.workflowId).catch(() => undefined) },
                { id: 'mock', label: 'Go to Mock URL', onSelect: () => goTab('mock-url') },
                { id: 'run', label: 'Run…', disabled: !canRun, onSelect: () => navigate(runSetupPath(docId, workflowId)) },
              ]}
            />
          </>
        }
      />
      <p className="wf-lead">{workflow.summary}</p>
      {asyncBlock ? (
        <Callout tone="warning" title="This workflow cannot run yet">
          <span id="wf-run-why">{asyncBlock.message}.</span>
        </Callout>
      ) : null}
      {lastRun && lastRun.status === 'FAILURE' && stopped ? (
        <Callout
          tone="danger"
          title={`${runHeadline(lastRun).title} · ${runHeadline(lastRun).detail}`}
          actions={
            <Button size="sm" onClick={() => navigate(runPath(lastRun.id))}>
              Open run #{lastRun.number}
            </Button>
          }
        >
          Last run of this workflow failed at <code>{stopped.stepId}</code>.
        </Callout>
      ) : null}

      <Tabs label="Workflow views" items={WORKFLOW_TABS.map((id) => ({ id, label: TAB_LABELS[id] }))} value={tab} onChange={goTab}>
        <TabPanel id="loom" value={tab}>
          <LoomTab detail={detail.data} runs={runList} run={selectedRun} step={step} onPickRun={onPickRun} onSelectStep={(s) => setQuery({ step: s })} inspectLink={inspectLink} />
        </TabPanel>
        <TabPanel id="steps" value={tab}>
          <StepsTab detail={detail.data} runs={runList} run={selectedRun} onPickRun={onPickRun} inspectLink={inspectLink} />
        </TabPanel>
        <TabPanel id="source" value={tab}>
          <SourceTab detail={detail.data} />
        </TabPanel>
        <TabPanel id="mock-url" value={tab}>
          <MockUrlTab detail={detail.data} runs={runList} />
        </TabPanel>
        <TabPanel id="sessions" value={tab}>
          {sessions.status === 'error' ? (
            <ErrorBlock error={sessions.error} onRetry={sessions.reload} />
          ) : sessions.data ? (
            <SessionsTab detail={detail.data} sessions={sessions.data} runs={runList} onChanged={reloadAll} />
          ) : (
            <LoadingBlock label="Loading the sessions" />
          )}
        </TabPanel>
        <TabPanel id="examples" value={tab}>
          {examples.status === 'error' ? (
            <ErrorBlock error={examples.error} onRetry={examples.reload} />
          ) : examples.data ? (
            <ExamplesTab detail={detail.data} runs={runList} examples={examples.data} />
          ) : (
            <LoadingBlock label="Loading the examples" />
          )}
        </TabPanel>
        <TabPanel id="runs" value={tab}>
          {runs.status === 'error' ? <ErrorBlock error={runs.error} onRetry={runs.reload} /> : <RunsTab detail={detail.data} runs={runList} initialFilter={search.get('filter') ?? undefined} />}
        </TabPanel>
      </Tabs>
    </>
  );
}

function titleOf(workflowId: string): string {
  return workflowId === 'restock-pastry' ? 'Restock a pastry' : workflowId;
}
