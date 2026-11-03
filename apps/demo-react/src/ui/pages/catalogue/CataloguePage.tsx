import '../explore-kit/explore.css';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { labelToString, type Protocol, type ServiceSummary } from '@/domain/shared';
import type { ServiceFilter } from '@/domain/catalog';
import { PageHeader, useQuery, useRelativeTime, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Chip } from '@/ui/components/ui/chip';
import { ConformanceBand, type OperationResult } from '@/ui/components/ui/conformance-band';
import { DataTable, type DataTableColumn } from '@/ui/components/ui/table';
import { EmptyState } from '@/ui/components/ui/empty-state';
import { Input } from '@/ui/components/ui/input';
import { Segmented } from '@/ui/components/ui/segmented';
import { StatusBadge } from '@/ui/components/ui/status-badge';
import { ErrorBlock, LoadingBlock } from '../explore-kit/states';
import { PROTOCOL_ORDER, fmt, operationUnit, pluralize } from '../explore-kit/format';

const bandOf = (s: ServiceSummary): OperationResult[] =>
  s.lastResults ? s.lastResults.map((r) => (r === 'pass' ? 'pass' : 'fail')) : Array.from({ length: s.operationCount }, () => 'untested');
const outcomeOf = (s: ServiceSummary) => (s.testStatus === 'passed' ? 'conformant' : s.testStatus === 'failed' ? 'failed' : 'never');
const callsText = (s: ServiceSummary) => `${fmt(s.calls24h)} ${s.protocol === 'EVENT' ? 'msg' : 'req'}`;
const lastTestText = (s: ServiceSummary, relative: (d: string) => string) => (s.lastTest ? `#${s.lastTest.runId} · ${relative(s.lastTest.when)}` : 'no test run yet');

export default function CataloguePage() {
  usePageTitle('APIs & Services · Microcks');
  const uc = useUseCases();
  const relative = useRelativeTime();
  const [filter, setFilter] = useState<ServiceFilter>({ query: '', protocols: [], labels: [], testStatus: 'all' });
  const [view, setView] = useState<'table' | 'wall'>('table');
  const view$ = useQuery(() => uc.catalog.browse(filter), [uc, filter.query, filter.testStatus, (filter.protocols ?? []).join(), (filter.labels ?? []).join()]);
  const labels$ = useQuery(() => uc.catalog.labels(), [uc]);

  const toggle = (key: 'protocols' | 'labels', value: string) =>
    setFilter((f) => {
      const cur = f[key] ?? [];
      return { ...f, [key]: cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value] };
    });
  const reset = () => setFilter({ query: '', protocols: [], labels: [], testStatus: 'all' });
  const activeCount = (filter.query?.trim() ? 1 : 0) + (filter.protocols?.length ?? 0) + (filter.labels?.length ?? 0) + (filter.testStatus && filter.testStatus !== 'all' ? 1 : 0);

  const data = view$.data;
  const actions = (
    <Button asChild variant="secondary" icon="plus">
      <RouterLink to="/sources/new">Direct API</RouterLink>
    </Button>
  );
  if (view$.status === 'error' && !data) {
    return (
      <>
        <PageHeader title="APIs & Services" actions={actions} />
        <ErrorBlock error={view$.error} what="The catalogue" onRetry={view$.reload} />
      </>
    );
  }
  if (!data) {
    return (
      <>
        <PageHeader title="APIs & Services" actions={actions} />
        <LoadingBlock label="the catalogue" />
      </>
    );
  }

  const labelNames = (labels$.data ?? []).map((l) => labelToString(l.label));
  const columns: DataTableColumn<ServiceSummary>[] = [
    {
      key: 'name', header: 'API / service',
      render: (s) => (
        <span className="ex-stack" style={{ gap: 2 }}>
          <span className="ex-row"><ApiBadge protocol={s.protocol} size="sm" /> <strong>{s.name}</strong> <span className="ex-muted">{s.version}</span></span>
          <span className="ex-small ex-secondary">{s.format}</span>
        </span>
      ),
    },
    { key: 'ops', header: 'Ops', render: (s) => s.operationCount },
    { key: 'labels', header: 'Labels', render: (s) => <span className="ex-row">{s.labels.map((l) => <Chip key={labelToString(l)} variant="outline" labelKey={l.key}>{l.value}</Chip>)}</span> },
    {
      key: 'test', header: 'Last test',
      render: (s) => (
        <span className="ex-stack" style={{ gap: 2 }}>
          <StatusBadge size="sm" status={outcomeOf(s)} />
          {s.lastTest ? <RouterLink to={s.protocol === 'A2A' ? `/tests/agent/${s.lastTest.runId}` : `/tests/runner/${s.lastTest.runId}`} className="ex-small">{lastTestText(s, relative)}</RouterLink> : <span className="ex-small ex-muted">no test run yet</span>}
        </span>
      ),
    },
    { key: 'conformance', header: 'Conformance', render: (s) => <span className="ex-row"><span>{s.conformance === null ? '—' : `${s.conformance}%`}</span><ConformanceBand size="mini" outcomes={bandOf(s)} unit={operationUnit(s.protocol)} /></span> },
    { key: 'calls', header: 'Mock 24 h', render: callsText },
    { key: 'updated', header: 'Updated', render: (s) => relative(s.updatedAt) },
  ];

  return (
    <div className="ex-stack">
      <PageHeader
        title="APIs & Services"
        eyebrow={
          <>
            {data.total} services · {data.operationsTotal} operations · <RouterLink to="/workflows">used by {data.workflowsUsing} workflows</RouterLink>
          </>
        }
        actions={actions}
      />
      <p className="ex-secondary" style={{ margin: 0 }}>Every imported contract becomes a live mock and a test target. Filter by protocol, by label or by last test result.</p>

      <section aria-label="Catalogue filters" className="ex-stack" aria-busy={view$.status === 'loading'}>
        <div className="ex-row">
          <Input type="search" aria-label="Filter by name" placeholder="Filter by name or version…" autoComplete="off" value={filter.query ?? ''} onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))} />
          <Segmented
            label="Last test result"
            value={filter.testStatus ?? 'all'}
            onChange={(id) => setFilter((f) => ({ ...f, testStatus: id as ServiceFilter['testStatus'] }))}
            options={[
              { id: 'all', label: 'All', count: data.facets.testStatus.all },
              { id: 'passed', label: 'Conformant', count: data.facets.testStatus.passed },
              { id: 'failed', label: 'Failing', count: data.facets.testStatus.failed },
              { id: 'never', label: 'Never tested', count: data.facets.testStatus.never },
            ]}
          />
          <Segmented label="View mode" value={view} onChange={(id) => setView(id as 'table' | 'wall')} options={[{ id: 'table', label: 'Table' }, { id: 'wall', label: 'Badge wall' }]} />
        </div>
        <div className="ex-row" role="group" aria-label="Protocol">
          <span className="ex-small ex-secondary" aria-hidden="true">Protocol</span>
          {PROTOCOL_ORDER.map((p: Protocol) => (
            <Chip key={p} pressed={(filter.protocols ?? []).includes(p)} onClick={() => toggle('protocols', p)}>
              {p} {data.facets.protocols[p] ?? 0}
            </Chip>
          ))}
        </div>
        <div className="ex-row" role="group" aria-label="Labels">
          <span className="ex-small ex-secondary" aria-hidden="true">Labels</span>
          {labelNames.map((l) => (
            <Chip key={l} pressed={(filter.labels ?? []).includes(l)} onClick={() => toggle('labels', l)}>
              {l} {data.facets.labels[l] ?? 0}
            </Chip>
          ))}
          {activeCount > 0 ? <Button size="sm" variant="ghost" onClick={reset}>Reset ({activeCount})</Button> : null}
        </div>
      </section>

      <div className="ex-row-between">
        <p role="status" aria-live="polite" data-testid="result-count" className="ex-secondary" style={{ margin: 0 }}>
          <strong>{data.services.length}</strong> of {data.total} APIs &amp; services
        </p>
        <span className="ex-small ex-muted">sort: recently updated</span>
      </div>

      {data.services.length === 0 ? (
        <EmptyState title="No API matches these filters" headingLevel={2} actions={<Button onClick={reset}>Reset filters</Button>}>
          <p>None of the {data.total} services matches the selection. Remove a filter or reset the selection.</p>
        </EmptyState>
      ) : view === 'table' ? (
        <DataTable<ServiceSummary>
          caption="APIs and services"
          captionHidden
          columns={columns}
          rows={data.services}
          rowKey="id"
          rowHref={(s) => `/services/${s.id}`}
          renderRowLink={(_s, props) => (
            <RouterLink to={props.href} className={props.className} aria-current={props['aria-current']}>
              {props.children}
            </RouterLink>
          )}
        />
      ) : (
        <div className="ex-tiles">
          {data.services.map((s) => (
            <article key={s.id} className="ex-tile">
              <span className="ex-row"><ApiBadge protocol={s.protocol} name={s.name} version={s.version} /></span>
              <span className="ex-small ex-secondary">{s.format} · {pluralize(s.operationCount, operationUnit(s.protocol))}</span>
              <span className="ex-row">
                <ApiBadge label="conformance" value={s.conformance === null ? 'untested' : `${s.conformance}%`} status={s.conformance === null ? 'neutral' : s.conformance >= 90 ? 'success' : s.conformance >= 60 ? 'warning' : 'danger'} size="sm" />
                <ApiBadge label="mcp" value={s.mcp ? 'agent-ready' : 'not exposed'} status={s.mcp ? 'info' : 'neutral'} size="sm" />
              </span>
              <span className="ex-row">{s.labels.map((l) => <Chip key={labelToString(l)} variant="outline" labelKey={l.key}>{l.value}</Chip>)}</span>
              <span className="ex-small ex-secondary">{callsText(s)} / 24 h · {relative(s.updatedAt)}</span>
              <RouterLink to={`/services/${s.id}`}>Open service<span className="sr-only"> {s.name} {s.version}</span></RouterLink>
            </article>
          ))}
        </div>
      )}
      <p className="ex-small ex-muted">{data.services.length} of {data.total} · page 1 of 1</p>
    </div>
  );
}
