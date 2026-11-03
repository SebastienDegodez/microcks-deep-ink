import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { formatDuration } from '@/domain/shared';
import { callTotals, runOutcome, stoppedStep, type RunOrigin, type WorkflowRun } from '@/domain/arazzo';
import type { WorkflowDetail } from '@/application/arazzo';
import { useRelativeTime } from '@/ui/app';
import { Button } from '@/ui/components/ui/button';
import { CodeBlock } from '@/ui/components/ui/code-block';
import { Segmented } from '@/ui/components/ui/segmented';
import { DataTable, type DataTableColumn } from '@/ui/components/ui/table';
import { ButtonRouterLink, ResultWord, RunOriginOf, RunTargetOf, StepStrip, runInputsText, runPath, runSetupPath } from '../../workflows/shared';

type Filter = 'all' | RunOrigin['kind'];

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ui', label: 'UI' },
  { id: 'api', label: 'API' },
  { id: 'mock-url', label: 'Mock URL' },
  { id: 'session', label: 'Session' },
];

export interface RunsTabProps {
  detail: WorkflowDetail;
  runs: WorkflowRun[];
  initialFilter?: string;
}

export function RunsTab({ detail, runs, initialFilter }: RunsTabProps) {
  const relative = useRelativeTime();
  const { workflow, document } = detail;
  const [filter, setFilter] = useState<Filter>(FILTERS.some((f) => f.id === initialFilter) ? (initialFilter as Filter) : 'all');
  const shown = filter === 'all' ? runs : runs.filter((r) => r.origin.kind === filter);
  const count = (f: Filter) => (f === 'all' ? runs.length : runs.filter((r) => r.origin.kind === f).length);
  const label = FILTERS.find((f) => f.id === filter)?.label ?? '';
  const api = `POST /api/arazzo/documents/${document.apiId}/workflows/${workflow.workflowId}/runs`;

  const columns: DataTableColumn<WorkflowRun>[] = [
    { key: 'run', header: 'Run', render: (r) => `#${r.number}` },
    { key: 'result', header: 'Result', render: (r) => <ResultWord result={runOutcome(r) === 'running' ? 'never' : (runOutcome(r) as 'passed' | 'failed')} /> },
    {
      key: 'origin',
      header: 'Origin',
      render: (r) => (
        <span className="wf-cell-stack">
          <RunOriginOf origin={r.origin} />
          <RunTargetOf run={r} />
        </span>
      ),
    },
    { key: 'inputs', header: 'Inputs', render: (r) => <span className="wf-cell-stack wf-cell-wide wf-mono">{runInputsText(r)}</span> },
    { key: 'steps', header: `Steps 1 → ${workflow.steps.length}`, render: (r) => <StepStrip count={workflow.steps.length} statuses={r.steps.map((s) => s.status)} /> },
    {
      key: 'end',
      header: 'End',
      render: (r) => {
        const s = stoppedStep(r);
        return s ? `${r.status === 'SUCCESS' ? 'Ended early at' : 'Stops at'} ${s.stepId}` : 'Runs to its end';
      },
    },
    { key: 'duration', header: 'Duration', render: (r) => (callTotals(r).ms > 0 ? formatDuration(callTotals(r).ms) : '—') },
    { key: 'started', header: 'Started', render: (r) => relative(r.startedAt) },
  ];

  return (
    <div className="wf-section">
      <div className="wf-row-between">
        <div className="wf-row">
          <h2 className="wf-h2">
            Last {runs.length} {runs.length === 1 ? 'run' : 'runs'}
          </h2>
          <Segmented label="Filter runs by origin" options={FILTERS.map((f) => ({ ...f, count: count(f.id) }))} value={filter} onChange={(id) => setFilter(id as Filter)} />
        </div>
        {workflow.runnability.runnable ? (
          <ButtonRouterLink to={runSetupPath(document.id, workflow.workflowId)} variant="primary" icon="play">
            Run workflow
          </ButtonRouterLink>
        ) : null}
      </div>

      {shown.length === 0 ? (
        <div className="wf-section">
          <p role="status">
            {runs.length === 0 ? 'This workflow has no run yet.' : `No run with the origin ${label} among the last runs.`}
          </p>
          {runs.length > 0 ? (
            <div>
              <Button onClick={() => setFilter('all')}>Show all runs</Button>
            </div>
          ) : null}
        </div>
      ) : (
        <DataTable<WorkflowRun>
          caption={`Runs of ${workflow.workflowId}${filter === 'all' ? '' : ` with the origin ${label}`}`}
          columns={columns}
          rows={shown}
          rowKey="id"
          renderRowLink={(r, props) => (
            <RouterLink
              className={props.className}
              to={runPath(r.id)}
            >
              {props.children}
            </RouterLink>
          )}
          rowHref={(r) => runPath(r.id)}
        />
      )}

      <div className="wf-section">
        <h3 className="wf-h3">Run it from a pipeline</h3>
        <CodeBlock language="http" caption="Starts a run and answers 201 with it" code={api} />
      </div>
    </div>
  );
}
