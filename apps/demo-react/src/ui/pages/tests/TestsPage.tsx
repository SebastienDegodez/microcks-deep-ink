import { useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import { filterRuns, runConformance, type TestRunSummary } from '@/domain/testing';
import { PageHeader, useQuery, useRelativeTime, usePageTitle, useUseCases } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { EmptyState } from '@/ui/components/ui/empty-state';
import { Field } from '@/ui/components/ui/field';
import { Panel } from '@/ui/components/ui/panel';
import { Select } from '@/ui/components/ui/select';
import { DataTable, type DataTableColumn } from '@/ui/components/ui/table';
import { StatusBadge, type Outcome } from '@/ui/components/ui/status-badge';
import { ErrorBlock, LoadingBlock } from './PageStates';
import { testRunHref } from '../explore-kit/format';
import { TestTimeline } from './TestTimeline';
import './tests.css';

const LIMIT = 12;
const OUTCOME: Record<TestRunSummary['result'], Outcome> = { passed: 'conformant', failed: 'failed', timeout: 'partial', running: 'running' };
const WORD: Record<TestRunSummary['result'], string> = { passed: 'Passed', failed: 'Failed', timeout: 'Timeout', running: 'Running' };

export default function TestsPage() {
  const { serviceId = '' } = useParams();
  usePageTitle('Test history · Microcks');
  const uc = useUseCases();
  const query = useQuery(
    () => Promise.all([uc.testing.listForService(serviceId, { limit: 1000 }), uc.testing.getCreateForm(serviceId)]),
    [serviceId],
  );
  const data = query.data;
  const service = data?.[1].services.find((s) => s.id === serviceId);

  return (
    <>
      <PageHeader
        title={service ? `Tests of ${service.name} ${service.version}` : 'Test history'}
        breadcrumb={[
          { label: 'APIs & Services', to: '/services' },
          ...(service ? [{ label: `${service.name} ${service.version}`, to: `/services/${serviceId}` }] : []),
          { label: 'Test history' },
        ]}
        actions={
          <Button asChild variant="primary" icon="play">
            <RouterLink to={`/tests/create?service=${serviceId}`}>Run a test</RouterLink>
          </Button>
        }
      />
      {service && service.protocol !== 'A2A' ? <OtherServices /> : null}
      {query.status === 'loading' && !data ? <LoadingBlock label="the test history" /> : null}
      {query.status === 'error' ? <ErrorBlock error={query.error} what="Test history" onRetry={query.reload} /> : null}
      {data ? <History key={serviceId} runs={data[0]} operations={data[1].targets.find((t) => t.serviceId === serviceId)?.operations ?? []} service={service} /> : null}
    </>
  );
}

/** The agent tests live on their own screen: point to the latest one from the history of any other service. */
function OtherServices() {
  const uc = useUseCases();
  const agent = useQuery(async () => {
    const [svc] = await uc.catalog.listServices({ protocols: ['A2A'] });
    const [run] = svc ? await uc.testing.listForService(svc.id) : [];
    return svc && run ? { svc, run } : undefined;
  }, [uc]);
  if (!agent.data) return null;
  const { svc, run } = agent.data;
  return (
    <p className="ex-row" style={{ margin: 0 }}>
      <span>Other services:</span>
      <RouterLink to={testRunHref(run)} className="ex-row">
        <ApiBadge protocol={svc.protocol} name={svc.name} version={svc.version} size="sm" />
        <span>run #{run.id} {run.result} {run.passed}/{run.total}</span>
       
      </RouterLink>
    </p>
  );
}

function History({
  runs,
  operations,
  service,
}: {
  runs: TestRunSummary[];
  operations: { id: string; verb: string; path: string }[];
  service?: { protocol: Parameters<typeof ApiBadge>[0]['protocol']; name: string; version: string };
}) {
  const relative = useRelativeTime();
  const [result, setResult] = useState<'all' | 'passed' | 'failed'>('all');
  const [runner, setRunner] = useState('all');
  const [endpoint, setEndpoint] = useState('all');
  const [showAll, setShowAll] = useState(false);

  const runners = useMemo(() => [...new Set(runs.map((r) => r.runner))], [runs]);
  const endpoints = useMemo(() => [...new Set(runs.map((r) => r.endpoint))], [runs]);
  const filtered = filterRuns(runs, { result, runner }).filter((r) => endpoint === 'all' || r.endpoint === endpoint);
  const matchIds = new Set(filtered.map((r) => r.id));
  const matches = (r: TestRunSummary) => matchIds.has(r.id);
  const visible = showAll ? filtered : filtered.slice(0, LIMIT);
  const [sel, setSel] = useState(() => (runs.find((r) => r.id === '117') ? '117' : runs[0]?.id));

  const columns: DataTableColumn<TestRunSummary>[] = [
    { key: 'id', header: 'Run', mono: true, render: (r) => `#${r.id}` },
    {
      key: 'result',
      header: 'Result',
      render: (r) => <StatusBadge status={OUTCOME[r.result]} label={WORD[r.result]} size="sm" />,
    },
    { key: 'conformance', header: 'Conformance', align: 'end', render: (r) => `${runConformance(r)}%` },
    { key: 'runner', header: 'Runner', mono: true },
    { key: 'endpoint', header: 'Endpoint', mono: true },
    { key: 'startedAt', header: 'Started', render: (r) => relative(r.startedAt) },
    { key: 'durationMs', header: 'Duration', align: 'end', render: (r) => `${r.durationMs} ms` },
  ];

  if (runs.length === 0) {
    return (
      <EmptyState title="No test yet" headingLevel={2}>
        <p>Run a first test to start the conformance history of this service.</p>
      </EmptyState>
    );
  }

  return (
    <div className="stack">
      {service ? <ApiBadge protocol={service.protocol} name={service.name} version={service.version} /> : null}

      <TestTimeline
        runs={runs}
        operations={operations}
        selectedId={sel}
        onSelect={setSel}
        matches={matches}
        filtered={result !== 'all' || runner !== 'all' || endpoint !== 'all'}
        relative={relative}
      />

      <Panel title="Runs">
        <div className="stack">
          <div className="ts-filters" role="group" aria-label="Filter test runs">
            <Field label="Result">
              {(c) => (
                <Select {...c} value={result} onChange={(e) => { setResult(e.target.value as typeof result); setShowAll(false); }}>
                  <option value="all">All results</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                </Select>
              )}
            </Field>
            <Field label="Runner">
              {(c) => (
                <Select {...c} value={runner} onChange={(e) => { setRunner(e.target.value); setShowAll(false); }}>
                  <option value="all">All runners</option>
                  {runners.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Endpoint">
              {(c) => (
                <Select {...c} value={endpoint} onChange={(e) => { setEndpoint(e.target.value); setShowAll(false); }}>
                  <option value="all">All endpoints</option>
                  {endpoints.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
              )}
            </Field>
          </div>
          <p role="status" className="demo-muted">
            {filtered.length} {filtered.length === 1 ? 'run' : 'runs'} match; showing {visible.length}.
          </p>
          <DataTable
            caption="Test runs"
            captionHidden
            columns={columns}
            rows={visible}
            rowKey="id"
            selectedKey={sel}
            rowHref={(r) => `/tests/runner/${r.id}`}
            emptyText="No run matches these filters."
            renderRowLink={(r, props) => (
              <RouterLink className={props.className} aria-current={props['aria-current']} to={`/tests/runner/${r.id}`}>
                {props.children}
              </RouterLink>
            )}
          />
          {filtered.length > LIMIT ? (
            <div>
              <Button onClick={() => setShowAll(!showAll)} aria-expanded={showAll}>
                {showAll ? `Show the latest ${LIMIT}` : `Show all ${filtered.length}`}
              </Button>
            </div>
          ) : null}
        </div>
      </Panel>

    </div>
  );
}
