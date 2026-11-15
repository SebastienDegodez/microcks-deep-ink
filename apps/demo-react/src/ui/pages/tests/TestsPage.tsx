import { useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import { filterRuns, type TestRunSummary } from '@/domain/testing';
import { PageHeader, useQuery, useRelativeTime, usePageTitle, useUseCases } from '@/ui/app';
import { ApiBadge, Icon, Segmented, Button, EmptyState, Select, DataTable, type DataTableColumn } from '@microcks/deep-ink';
import { TEST_RESULT_ICON, TEST_RESULT_WORD } from '@/ui/app/outcomes';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { testRunHref } from '@/ui/app/format';
import { TestTimeline } from './TestTimeline';
import { fmtDuration, rateTone, shortDate, timelineRuns } from './timeline';
import {
  bandLabel,
  bandOutcomes,
  bandTitle,
  endpointHost,
  HISTORY_LIMIT,
  historyDescription,
  historyEnvironments,
  historyRunners,
  initialRunId,
  LAST_TEST_TONE,
  latestRun,
  moreRunsLabel,
  oldestRunNumber,
  passRateOf,
  relaunchHref,
  resultOptions,
  serviceLinkLabel,
  visibleRuns,
} from './history';
import '@microcks/demo-styles/pages/tests/tests.css';

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

  const runs = data?.[0] ?? [];
  const latest = latestRun(runs);
  const recent = timelineRuns(runs);
  const passRate = passRateOf(recent);

  return (
    <>
      <PageHeader
        title="Test history"
        variant="subtitle"
        breadcrumb={[
          { label: 'APIs & Services', to: '/services' },
          ...(service ? [{ label: `${service.name} ${service.version}`, to: `/services/${serviceId}` }] : []),
          { label: 'Test history' },
        ]}
        leading={
          service ? (
            <RouterLink className="tests-title-badge" to={`/services/${serviceId}`} aria-label={serviceLinkLabel(service)}>
              <ApiBadge protocol={service.protocol} name={service.name} version={service.version} size="xl" />
            </RouterLink>
          ) : null
        }
        descriptionWidth={760}
        description={service ? historyDescription(service) : undefined}
        descriptionTone="secondary"
        align="start"
        actions={
          <Button asChild variant="primary" icon="plus">
            <RouterLink to={`/tests/create?service=${serviceId}`}>New test</RouterLink>
          </Button>
        }
      />
      {service ? (
        <div className="tests-head-extra">
          <ul className="tests-kpis" aria-label="Test summary">
            {service.conformance !== null ? (
              <li><ApiBadge label="conformance" value={`${service.conformance}%`} status={rateTone(service.conformance)} /></li>
            ) : null}
            {latest ? (
              <li><ApiBadge label="last test" value={TEST_RESULT_WORD[latest.result].toLowerCase()} status={LAST_TEST_TONE[latest.result]} /></li>
            ) : null}
            {passRate !== null ? (
              <li><ApiBadge label={`pass rate · ${recent.length} runs`} value={`${passRate}%`} status={rateTone(passRate)} /></li>
            ) : null}
          </ul>
          {service.protocol !== 'A2A' ? <OtherServices /> : null}
        </div>
      ) : null}
      {query.status === 'loading' && !data ? <LoadingBlock label="the test history" /> : null}
      {query.status === 'error' ? <ErrorBlock error={query.error} what="Test history" onRetry={query.reload} /> : null}
      {data ? <History key={serviceId} runs={data[0]} operations={data[1].targets.find((t) => t.serviceId === serviceId)?.operations ?? []} /> : null}
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
    <RouterLink to={testRunHref(run)} className="tests-other">
      <span>Other services:</span>
      <ApiBadge protocol={svc.protocol} name={svc.name} version={svc.version} size="sm" />
      <span className="tests-other-run" data-result={run.result}>run #{run.id} {run.result} {run.passed}/{run.total}</span>
      <Icon name="arrow-right" size={13} className="tests-other-arrow" />
    </RouterLink>
  );
}

function History({
  runs,
  operations,
}: {
  runs: TestRunSummary[];
  operations: { id: string; verb: string; path: string }[];
}) {
  const relative = useRelativeTime();
  const [result, setResult] = useState<'all' | 'passed' | 'failed'>('all');
  const [runner, setRunner] = useState('all');
  const [environment, setEnvironment] = useState('all');
  const [showAll, setShowAll] = useState(false);

  const runners = useMemo(() => historyRunners(runs), [runs]);
  const environments = useMemo(() => historyEnvironments(runs), [runs]);
  const isFiltered = result !== 'all' || runner !== 'all' || environment !== 'all';
  const filtered = filterRuns(runs, { result, runner, environment });
  const matchIds = new Set(filtered.map((r) => r.id));
  const matches = (r: TestRunSummary) => matchIds.has(r.id);
  const visible = visibleRuns(filtered, showAll || isFiltered);
  const [sel, setSel] = useState(() => initialRunId(runs));
  const reset = () => { setResult('all'); setRunner('all'); setEnvironment('all'); };
  const oldest = oldestRunNumber(runs);

  const columns: DataTableColumn<TestRunSummary>[] = [
    {
      key: 'id',
      header: 'Run',
      render: (r) => (
        <button type="button" className="tests-run-id" aria-label={`Show run #${r.id} in the timeline`} onClick={() => setSel(r.id)}>
          #{r.id}
        </button>
      ),
    },
    {
      key: 'startedAt',
      header: 'When',
      nowrap: true,
      render: (r) => (
        <span className="tests-when">
          <span>{relative(r.startedAt)}</span>
          <span className="tests-when-date">{shortDate(r.startedAt)}</span>
        </span>
      ),
    },
    {
      key: 'endpoint',
      header: 'Endpoint',
      render: (r) => (
        <span className="tests-endpoint">
          <span className="tests-env" data-env={r.environment}>{r.environment}</span>
          <span className="tests-endpoint-url">{r.endpoint}</span>
        </span>
      ),
    },
    { key: 'runner', header: 'Runner', nowrap: true, render: (r) => <span className="tests-runner">{r.runner}</span> },
    {
      key: 'durationMs',
      header: 'Duration',
      align: 'end',
      nowrap: true,
      render: (r) => <span className="tests-duration" data-result={r.result}>{fmtDuration(r.durationMs)}</span>,
    },
    {
      key: 'result',
      header: 'Result',
      render: (r) => (
        <span className="tests-result" data-result={r.result}>
          <span className="tests-result-word">
            <Icon name={TEST_RESULT_ICON[r.result]} size={14} strokeWidth={r.result === 'timeout' ? 2.2 : 2.6} />
            {TEST_RESULT_WORD[r.result]}
          </span>
          {r.reason ? <span className="tests-result-reason">{r.reason}</span> : null}
        </span>
      ),
    },
    {
      key: 'operations',
      header: 'Operations',
      render: (r) => {
        const outcomes = bandOutcomes(operations, r);
        return (
          <span className="tests-band" role="img" aria-label={bandLabel(operations, outcomes)}>
            {outcomes.map((o, i) => (
              <span key={operations[i]?.id ?? i} data-outcome={o} title={bandTitle(operations[i], o)} />
            ))}
          </span>
        );
      },
    },
    { key: 'samples', header: 'Samples', align: 'end', nowrap: true, render: (r) => <span className="tests-samples">{r.passed}/{r.total}</span> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'end',
      nowrap: true,
      render: (r) => (
        <span className="tests-actions">
          <Button asChild size="sm" variant="secondary">
            <RouterLink to={testRunHref(r)} aria-label={`Open run #${r.id}`}>Open</RouterLink>
          </Button>
          <Button asChild size="sm" variant="ghost" icon="reset" iconOnly aria-label={`Relaunch run #${r.id}`} title="Relaunch with the same configuration">
            <RouterLink to={relaunchHref(r)} />
          </Button>
        </span>
      ),
    },
  ];

  if (runs.length === 0) {
    return (
      <EmptyState title="No test yet" headingLevel={2}>
        <p>Run a first test to start the conformance history of this service.</p>
      </EmptyState>
    );
  }

  return (
    <div className="stack tests-history">
      <TestTimeline
        runs={runs}
        operations={operations}
        selectedId={sel}
        onSelect={setSel}
        matches={matches}
        filtered={isFiltered}
        relative={relative}
      />

      <div className="tests-filters" role="search" aria-label="Filter runs">
        <Segmented
          label="Result"
          variant="joined"
          value={result}
          onChange={(id) => { setResult(id as typeof result); setShowAll(false); }}
          options={resultOptions(runs)}
        />
        <span className="tests-filter">
          <label htmlFor="tests-runner">Runner</label>
          <Select id="tests-runner" className="tests-filter-select" size="sm" value={runner} onChange={(e) => { setRunner(e.target.value); setShowAll(false); }}>
            <option value="all">All runners</option>
            {runners.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </span>
        <span className="tests-filter">
          <label htmlFor="tests-endpoint">Endpoint</label>
          <Select id="tests-endpoint" className="tests-filter-select" size="sm" value={environment} onChange={(e) => { setEnvironment(e.target.value); setShowAll(false); }}>
            <option value="all">All endpoints</option>
            {environments.map(([env, url]) => <option key={env} value={env}>{env} · {endpointHost(url)}</option>)}
          </Select>
        </span>
        {isFiltered ? <Button variant="link" onClick={reset}>Reset filters</Button> : null}
        <p role="status" className="tests-count">
          Showing {visible.length} of {runs.length} runs{isFiltered ? ` · ${filtered.length} match the filters` : ''}
        </p>
      </div>

      <section className="tests-table" aria-label="Test runs">
        <DataTable
          caption="Test runs"
          captionHidden
          columns={columns}
          rows={visible}
          rowKey="id"
          selectedKey={sel}
          emptyText="No run matches these filters."
        />
        {visible.length === 0 ? (
          <p className="tests-table-empty">
            <Button variant="link" onClick={reset}>Reset filters</Button>
          </p>
        ) : null}
        {!isFiltered && filtered.length > HISTORY_LIMIT ? (
          <div className="tests-table-more">
            <Button size="sm" variant="secondary" onClick={() => setShowAll(!showAll)} aria-expanded={showAll}>
              {moreRunsLabel(showAll, filtered.length)}
            </Button>
          </div>
        ) : null}
      </section>
      {Number.isFinite(oldest) && oldest > 1 ? (
        <p className="tests-footnote">
          Runs are kept with their results and request/response exchanges. Test #1 to #{oldest - 1} are older than the {runs.length} runs listed here.
        </p>
      ) : null}
    </div>
  );
}
