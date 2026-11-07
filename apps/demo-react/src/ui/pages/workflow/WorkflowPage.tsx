import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { stoppedStep } from '@/domain/arazzo';
import { PageHeader, useQuery, useUseCases, usePageTitle } from '@/ui/app';
import { Callout, TabPanel, Tabs } from '@microcks/deep-ink';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { WORKFLOW_TABS, isWorkflowTab, workflowPath, type WorkflowTab } from '../workflows/shared';
import '../workflows/workflows.css';
import './workflow.css';
import { LastRunNote, WorkflowHeader } from './WorkflowHeader';
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
  const catalog = useQuery(() => uc.catalog.listServices(), []);

  usePageTitle(`${detail.data?.workflow.summary ?? (workflowId || 'Workflow')} · Microcks`);

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
        <PageHeader title={workflowId} />
        <LoadingBlock label="the workflow" rows={5} />
      </>
    );
  }

  const { workflow, document } = detail.data;
  const runList = runs.data ?? [];
  const runNumber = Number(search.get('run'));
  const selectedRun = runList.find((r) => r.number === runNumber) ?? runList[0];
  const step = search.get('step') ?? undefined;
  const lastRun = runList[0];

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

  const asyncBlock = !workflow.runnability.runnable ? workflow.runnability : undefined;
  const services = catalog.data ?? [];
  const serviceLabel = (id: string) => {
    const svc = services.find((x) => x.id === id);
    return svc ? `${svc.name} ${svc.version}` : undefined;
  };
  const counts: Partial<Record<WorkflowTab, number | undefined>> = {
    steps: workflow.steps.length,
    sessions: sessions.data?.length || undefined,
    examples: examples.data?.length || undefined,
    // Runs are numbered per workflow: the latest number is the total.
    runs: lastRun?.number,
  };

  return (
    <div className="wf-workflow">
      <WorkflowHeader document={document} workflow={workflow} runs={runList} serviceLabel={serviceLabel} onMockUrl={() => goTab('mock-url')} />
      {asyncBlock ? (
        <Callout tone="warning" title="This workflow cannot run yet">
          <span id="wf-run-why">{asyncBlock.message}.</span>
        </Callout>
      ) : null}
      {lastRun ? <LastRunNote document={document} workflow={workflow} run={lastRun} /> : null}

      <Tabs label="Workflow views" items={WORKFLOW_TABS.map((id) => ({ id, label: TAB_LABELS[id], count: counts[id] }))} value={tab} onChange={goTab}>
        <TabPanel id="loom" value={tab}>
          <LoomTab detail={detail.data} runs={runList} run={selectedRun} step={step} sessions={sessions.data} serviceLabel={serviceLabel} onPickRun={onPickRun} onSelectStep={(s) => setQuery({ step: s })} inspectLink={inspectLink} />
        </TabPanel>
        <TabPanel id="steps" value={tab}>
          <StepsTab detail={detail.data} runs={runList} run={selectedRun} onPickRun={onPickRun} inspectLink={inspectLink} />
        </TabPanel>
        <TabPanel id="source" value={tab}>
          <SourceTab detail={detail.data} step={step ?? (selectedRun?.status === 'FAILURE' ? stoppedStep(selectedRun)?.stepId : undefined)} onSelectStep={(s) => setQuery({ step: s })} serviceLabel={serviceLabel} />
        </TabPanel>
        <TabPanel id="mock-url" value={tab}>
          <MockUrlTab detail={detail.data} runs={runList} onShowRuns={() => navigate(workflowPath(docId, workflowId, 'runs', { filter: 'mock-url' }))} />
        </TabPanel>
        <TabPanel id="sessions" value={tab}>
          {sessions.status === 'error' ? (
            <ErrorBlock error={sessions.error} onRetry={sessions.reload} />
          ) : sessions.data ? (
            <SessionsTab detail={detail.data} sessions={sessions.data} runs={runList} />
          ) : (
            <LoadingBlock label="the sessions" rows={3} />
          )}
        </TabPanel>
        <TabPanel id="examples" value={tab}>
          {examples.status === 'error' ? (
            <ErrorBlock error={examples.error} onRetry={examples.reload} />
          ) : examples.data ? (
            <ExamplesTab detail={detail.data} runs={runList} examples={examples.data} serviceLabel={serviceLabel} />
          ) : (
            <LoadingBlock label="the examples" rows={3} />
          )}
        </TabPanel>
        <TabPanel id="runs" value={tab}>
          {runs.status === 'error' ? <ErrorBlock error={runs.error} onRetry={runs.reload} /> : <RunsTab detail={detail.data} runs={runList} sessions={sessions.data} initialFilter={search.get('filter') ?? undefined} />}
        </TabPanel>
      </Tabs>
    </div>
  );
}
