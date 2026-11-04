import { useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import { filterRuns, type TestRunSummary } from '@/domain/testing';
import { PageHeader, useQuery, useRelativeTime, usePageTitle, useUseCases } from '@/ui/app';
import { ApiBadge, type ProofStatus } from '@/ui/components/ui/api-badge';
import { Icon, type IconName } from '@/ui/components/ui/icon';
import { Segmented } from '@/ui/components/ui/segmented';
import { Button } from '@/ui/components/ui/button';
import { EmptyState } from '@/ui/components/ui/empty-state';
import { Select } from '@/ui/components/ui/select';
import { DataTable, type DataTableColumn } from '@/ui/components/ui/table';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { testRunHref } from '../explore-kit/format';
import { fmtDuration, shortDate, TestTimeline, timelineRuns } from './TestTimeline';
import './tests.css';

const LIMIT = 12;
const WORD: Record<TestRunSummary['result'], string> = { passed: 'Passed', failed: 'Failed', timeout: 'Timed out', running: 'Running' };
const RESULT_ICON: Record<TestRunSummary['result'], IconName> = { passed: 'check', failed: 'cross', timeout: 'clock', running: 'running' };
const OP_WORD = { pass: 'passed', fail: 'failed', none: 'no result' } as const;

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
  const latest = runs.reduce<TestRunSummary | undefined>((a, r) => (!a || r.startedAt > a.startedAt ? r : a), undefined);
  const recent = timelineRuns(runs);
  const passRate = recent.length ? Math.round((recent.filter((r) => r.result === 'passed').length / recent.length) * 100) : null;
  const examples = service?.exampleCount;

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
            <RouterLink className="tests-title-badge" to={`/services/${serviceId}`} aria-label={`${service.protocol} ${service.name} ${service.version}, open the service`}>
              <ApiBadge protocol={service.protocol} name={service.name} version={service.version} size="xl" />
            </RouterLink>
          ) : null
        }
        descriptionWidth={760}
        description={
          service
            ? `Conformance tests run against the implementations of this contract, on every endpoint. Each run replays the ${examples ?? ''}${examples ? ' ' : ''}contract examples and checks responses against the ${service.format.split(' ')[0]} schemas.`
            : undefined
        }
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
              <li><ApiBadge label="conformance" value={`${service.conformance}%`} status={tone(service.conformance)} /></li>
            ) : null}
            {latest ? (
              <li><ApiBadge label="last test" value={LAST_WORD[latest.result]} status={LAST_TONE[latest.result]} /></li>
            ) : null}
            {passRate !== null ? (
              <li><ApiBadge label={`pass rate · ${recent.length} runs`} value={`${passRate}%`} status={tone(passRate)} /></li>
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

const LAST_WORD: Record<TestRunSummary['result'], string> = { passed: 'passed', failed: 'failed', timeout: 'timed out', running: 'running' };
const LAST_TONE: Record<TestRunSummary['result'], ProofStatus> = { passed: 'success', failed: 'danger', timeout: 'warning', running: 'info' };
const tone = (pct: number): ProofStatus => (pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'danger');

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

  const runners = useMemo(() => [...new Set(runs.map((r) => r.runner))], [runs]);
  const environments = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of runs) if (!seen.has(r.environment)) seen.set(r.environment, r.endpoint);
    return [...seen];
  }, [runs]);
  const isFiltered = result !== 'all' || runner !== 'all' || environment !== 'all';
  const filtered = filterRuns(runs, { result, runner, environment });
  const matchIds = new Set(filtered.map((r) => r.id));
  const matches = (r: TestRunSummary) => matchIds.has(r.id);
  const visible = showAll || isFiltered ? filtered : filtered.slice(0, LIMIT);
  const [sel, setSel] = useState(() => (runs.find((r) => r.id === '117') ? '117' : runs[0]?.id));
  const passedCount = runs.filter((r) => r.result === 'passed').length;
  const reset = () => { setResult('all'); setRunner('all'); setEnvironment('all'); };
  const oldest = runs.reduce((min, r) => Math.min(min, Number(r.id)), Number.POSITIVE_INFINITY);

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
            <Icon name={RESULT_ICON[r.result]} size={14} strokeWidth={r.result === 'timeout' ? 2.2 : 2.6} />
            {WORD[r.result]}
          </span>
          {r.reason ? <span className="tests-result-reason">{r.reason}</span> : null}
        </span>
      ),
    },
    {
      key: 'operations',
      header: 'Operations',
      render: (r) => {
        const outcomes = operations.map((_, i) => r.operations?.[i] ?? 'none');
        return (
          <span className="tests-band" role="img" aria-label={operations.map((op, i) => `${op.verb} ${op.path} ${OP_WORD[outcomes[i] ?? 'none']}`).join(', ')}>
            {outcomes.map((o, i) => (
              <span key={operations[i]?.id ?? i} data-outcome={o} title={`${operations[i]?.verb} ${operations[i]?.path}: ${OP_WORD[o]}`} />
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
            <RouterLink to={`/tests/create?service=${r.serviceId}&from=${r.id}`} />
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
          options={[
            { id: 'all', label: 'All', count: runs.length },
            { id: 'passed', label: 'Passed', count: passedCount },
            { id: 'failed', label: 'Failed', count: runs.length - passedCount },
          ]}
        />
        <span className="tests-filter">
          <label htmlFor="tests-runner">Runner</label>
          <Select id="tests-runner" size="sm" value={runner} onChange={(e) => { setRunner(e.target.value); setShowAll(false); }}>
            <option value="all">All runners</option>
            {runners.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </span>
        <span className="tests-filter">
          <label htmlFor="tests-endpoint">Endpoint</label>
          <Select id="tests-endpoint" size="sm" value={environment} onChange={(e) => { setEnvironment(e.target.value); setShowAll(false); }}>
            <option value="all">All endpoints</option>
            {environments.map(([env, url]) => <option key={env} value={env}>{env} · {url.replace(/^https?:\/\//, '')}</option>)}
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
        {!isFiltered && filtered.length > LIMIT ? (
          <div className="tests-table-more">
            <Button size="sm" variant="secondary" onClick={() => setShowAll(!showAll)} aria-expanded={showAll}>
              {showAll ? `Show the ${LIMIT} latest only` : `Show ${filtered.length - LIMIT} older runs`}
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
