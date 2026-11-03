import { useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import { filterRuns, runConformance, type TestRunSummary } from '@/domain/testing';
import { PageHeader, useQuery, useRelativeTime, usePageTitle, useUseCases } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Disclosure } from '@/ui/components/ui/disclosure';
import { EmptyState } from '@/ui/components/ui/empty-state';
import { Field } from '@/ui/components/ui/field';
import { Icon } from '@/ui/components/ui/icon';
import { Panel } from '@/ui/components/ui/panel';
import { Select } from '@/ui/components/ui/select';
import { DataTable, type DataTableColumn } from '@/ui/components/ui/table';
import { StatusBadge, type Outcome } from '@/ui/components/ui/status-badge';
import { ErrorBlock, LoadingBlock } from './PageStates';
import './tests.css';

const LIMIT = 12;
const OUTCOME: Record<TestRunSummary['result'], Outcome> = { passed: 'conformant', failed: 'failed', timeout: 'partial', running: 'running' };
const WORD: Record<TestRunSummary['result'], string> = { passed: 'Passed', failed: 'Failed', timeout: 'Timeout', running: 'Running' };

export default function TestsPage() {
  const { serviceId = '' } = useParams();
  usePageTitle('Test history · Microcks');
  const uc = useUseCases();
  const query = useQuery(
    () => Promise.all([uc.testing.listForService(serviceId, { limit: 1000 }), uc.testing.timeline(serviceId), uc.testing.getCreateForm(serviceId)]),
    [serviceId],
  );
  const data = query.data;
  const service = data?.[2].services.find((s) => s.id === serviceId);

  return (
    <>
      <PageHeader
        title={service ? `Tests of ${service.name} ${service.version}` : 'Test history'}
        eyebrow="Tests"
        actions={
          <Button asChild variant="primary" icon="play">
            <RouterLink to={`/tests/create?service=${serviceId}`}>Run a test</RouterLink>
          </Button>
        }
      />
      {query.status === 'loading' && !data ? <LoadingBlock label="the test history" /> : null}
      {query.status === 'error' ? <ErrorBlock error={query.error} what="Test history" onRetry={query.reload} /> : null}
      {data ? <History key={serviceId} runs={data[0]} timeline={data[1]} operations={data[2].targets.find((t) => t.serviceId === serviceId)?.operations ?? []} service={service} /> : null}
    </>
  );
}

function History({
  runs,
  timeline,
  operations,
  service,
}: {
  runs: TestRunSummary[];
  timeline: { runId: string; startedAt: string; result: TestRunSummary['result']; conformance: number }[];
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
  const visible = showAll ? filtered : filtered.slice(0, LIMIT);
  const selectedKey = runs.find((r) => r.id === '117') ? '117' : runs[0]?.id;

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

  const latest = timeline[timeline.length - 1];
  const first = timeline[0];
  const summary = latest && first
    ? `${timeline.length} runs. Conformance went from ${first.conformance}% (run #${first.runId}) to ${latest.conformance}% (run #${latest.runId}, ${WORD[latest.result].toLowerCase()}).`
    : '';

  const W = 640;
  const H = 200;
  const x = (i: number) => 40 + (timeline.length <= 1 ? 280 : (i * 560) / (timeline.length - 1));
  const y = (v: number) => 20 + ((100 - v) * 140) / 100;

  const matrixRuns = runs.slice(0, 6);

  return (
    <div className="di-stack">
      {service ? <ApiBadge protocol={service.protocol} name={service.name} version={service.version} /> : null}

      <Panel title="Conformance timeline">
        <p>{summary}</p>
        <svg className="ts-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="ts-title ts-desc">
          <title id="ts-title">Conformance of each test run</title>
          <desc id="ts-desc">{summary} The table below gives every value.</desc>
          {[0, 50, 100].map((v) => (
            <g key={v}>
              <line className="ts-grid" x1="40" x2="600" y1={y(v)} y2={y(v)} />
              <text x="4" y={y(v) + 4}>{v}%</text>
            </g>
          ))}
          <polyline className="ts-line" points={timeline.map((p, i) => `${x(i)},${y(p.conformance)}`).join(' ')} />
          {timeline.map((p, i) =>
            p.result === 'passed' ? (
              <circle key={p.runId} className="ts-ok" cx={x(i)} cy={y(p.conformance)} r="6" />
            ) : (
              <rect key={p.runId} className="ts-ko" x={x(i) - 6} y={y(p.conformance) - 6} width="12" height="12" />
            ),
          )}
          {timeline.map((p, i) => (
            <text key={`l${p.runId}`} x={x(i) - 10} y="190">#{p.runId}</text>
          ))}
        </svg>
        <p className="demo-muted">Circles are passed runs, squares are failed runs.</p>
        <Disclosure summary="Show data table">
          <div className="demo-scroll">
            <table className="ts-matrix">
              <caption className="di-sr-only">Conformance of each test run</caption>
              <thead>
                <tr><th scope="col">Run</th><th scope="col">Started</th><th scope="col">Result</th><th scope="col">Conformance</th></tr>
              </thead>
              <tbody>
                {timeline.map((p) => (
                  <tr key={p.runId}>
                    <th scope="row">#{p.runId}</th>
                    <td>{relative(p.startedAt)}</td>
                    <td>{WORD[p.result]}</td>
                    <td>{p.conformance}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Disclosure>
      </Panel>

      <Panel title="Runs">
        <div className="di-stack">
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
            selectedKey={selectedKey}
            rowHref={(r) => `/tests/runner/${r.id}`}
            emptyText="No run matches these filters."
            renderRowLink={(r, props) => (
              <RouterLink className={props.className} aria-current={props['aria-current']} to={`/tests/runner/${r.id}`} aria-label={`Open run #${r.id}, ${WORD[r.result]}`}>
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

      {operations.length > 0 ? (
        <Panel title="Operations by run">
          <div className="demo-scroll">
            <table className="ts-matrix">
              <caption className="di-sr-only">Result of each operation in the latest test runs</caption>
              <thead>
                <tr>
                  <th scope="col">Operation</th>
                  {matrixRuns.map((r) => <th scope="col" key={r.id}>#{r.id}</th>)}
                </tr>
              </thead>
              <tbody>
                {operations.map((op, i) => (
                  <tr key={op.id}>
                    <th scope="row"><span className="demo-mono">{op.verb} {op.path}</span></th>
                    {matrixRuns.map((r) => {
                      const o = r.operations?.[i];
                      return (
                        <td key={r.id}>
                          <span className="ts-cell">
                            <Icon name={o === 'pass' ? 'check' : o === 'fail' ? 'cross' : 'dash'} size={16} />
                            {o === 'pass' ? 'Pass' : o === 'fail' ? 'Fail' : 'No result'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
