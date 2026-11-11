import '@microcks/demo-styles/pages/explore-kit/explore.css';
import '@microcks/demo-styles/pages/catalogue/catalogue.css';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { labelFromString, labelToString, type Protocol, type ServiceSummary } from '@/domain/shared';
import type { ServiceFilter } from '@/domain/catalog';
import { PageHeader, useQuery, useRelativeTime, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge, Button, Chip, ConformanceBand, DataTable, type DataTableColumn, EmptyState, Icon, FilterBar, FilterReset, FilterRow, FilterSearch, Segmented, StatusBadge } from '@microcks/deep-ink';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { PROTOCOL_ORDER, operationUnit, pluralize } from '@/ui/app/format';
import { serviceOutcomes } from '@/ui/app/outcomes';
import { FEATURED_LABELS, TEST_WORD, activeFilterCount, activeFilterWords, callsText, lastTestText, levelOf, outcomeOf, testsHref } from './listing';

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
  const activeCount = activeFilterCount(filter);

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

  const known = new Set((labels$.data ?? []).map((l) => labelToString(l.label)));
  const labelNames = FEATURED_LABELS.filter((l) => known.has(l));
  const labelChips = (s: ServiceSummary) => (
    <span className="catalogue-labels">
      {s.labels.map((l) => (
        <Chip key={labelToString(l)} size="sm" labelKey={l.key} className="catalogue-label-chip">
          {l.value}
        </Chip>
      ))}
    </span>
  );
  const columns: DataTableColumn<ServiceSummary>[] = [
    {
      key: 'name', header: 'API / service',
      render: (s) => (
        <span className="catalogue-service">
          <RouterLink to={`/services/${s.id}`} className="catalogue-badge-link">
            <ApiBadge protocol={s.protocol} name={s.name} version={s.version} />
          </RouterLink>
          <span className="catalogue-format">{s.format}</span>
        </span>
      ),
    },
    { key: 'ops', header: 'Ops', align: 'end', mono: true, render: (s) => s.operationCount },
    { key: 'labels', header: 'Labels', render: labelChips },
    {
      key: 'test', header: 'Last test', nowrap: true,
      render: (s) => {
        const word = TEST_WORD[s.testStatus];
        const meta = lastTestText(s, relative);
        return (
          <RouterLink to={testsHref(s)} className="catalogue-test">
            <span className="sr-only">Tests of {s.name} {s.version}: </span>
            <StatusBadge status={outcomeOf(s)} label={word} />
            <span className="sr-only">, </span>
            <span className="catalogue-test-meta">{meta}</span>
          </RouterLink>
        );
      },
    },
    {
      key: 'conformance', header: 'Conformance',
      render: (s) => (
        <span className="catalogue-conformance">
          <span className="catalogue-score" data-level={levelOf(s.conformance)}>{s.conformance === null ? '—' : `${s.conformance}%`}</span>
          <ConformanceBand size="mini" outcomes={serviceOutcomes(s)} unit={operationUnit(s.protocol)} />
        </span>
      ),
    },
    { key: 'calls', header: 'Mock 24 h', align: 'end', mono: true, nowrap: true, render: callsText },
    { key: 'updated', header: 'Updated', nowrap: true, render: (s) => <span className="ex-muted">{relative(s.updatedAt)}</span> },
    {
      key: 'open', header: 'Open', headerHidden: true, align: 'end',
      render: (s) => (
        <RouterLink to={`/services/${s.id}`} className="catalogue-open" aria-label={`Open ${s.name} ${s.version}`}>
          <Icon name="chevron" size={14} />
        </RouterLink>
      ),
    },
  ];

  const activeDesc = activeFilterWords(filter);

  return (
    <div className="catalogue" data-main-pad="roomy">
      <PageHeader
        title="APIs & Services"
        size="lg"
        meta={
          <>
            {data.total} services · {data.operationsTotal} operations · <RouterLink to="/workflows">used by {data.workflowsUsing} workflows</RouterLink>
          </>
        }
        description="Every imported contract becomes a live mock and a test target. Filter by protocol, by label or by last test result."
        actions={actions}
      />

      <FilterBar label="Catalogue filters" aria-busy={view$.status === 'loading'}>
        <FilterRow>
          <FilterSearch label="Filter by name" placeholder="Filter by name or version…" autoComplete="off" value={filter.query ?? ''} onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))} />
          <Segmented
            label="Last test result"
            value={filter.testStatus ?? 'all'}
            onChange={(id) => setFilter((f) => ({ ...f, testStatus: id as ServiceFilter['testStatus'] }))}
            options={[
              { id: 'all', label: 'All', dot: 'neutral', count: data.facets.testStatus.all },
              { id: 'passed', label: 'Conformant', dot: 'success', count: data.facets.testStatus.passed },
              { id: 'failed', label: 'Failing', dot: 'danger', count: data.facets.testStatus.failed },
              { id: 'never', label: 'Never tested', dot: 'muted', count: data.facets.testStatus.never },
            ]}
          />
          <Segmented
            className="filter-bar-end"
            label="View mode"
            value={view}
            onChange={(id) => setView(id as 'table' | 'wall')}
            options={[{ id: 'table', label: 'Table', icon: 'list' }, { id: 'wall', label: 'Badge wall', icon: 'badge-wall' }]}
          />
        </FilterRow>
        <FilterRow title="Protocol">
          {PROTOCOL_ORDER.map((p: Protocol) => (
            <Chip key={p} protocol={p} count={data.facets.protocols[p] ?? 0} pressed={(filter.protocols ?? []).includes(p)} onClick={() => toggle('protocols', p)}>
              {p}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow title="Labels">
          {labelNames.map((l) => {
            const { key, value } = labelFromString(l);
            return (
              <Chip key={l} labelKey={key} count={data.facets.labels[l] ?? 0} pressed={(filter.labels ?? []).includes(l)} onClick={() => toggle('labels', l)}>
                {value}
              </Chip>
            );
          })}
          {activeCount > 0 ? <FilterReset count={activeCount} onClick={reset} /> : null}
        </FilterRow>
      </FilterBar>

      <div className="catalogue-result">
        <p role="status" aria-live="polite" data-testid="result-count">
          <strong>{data.services.length}</strong> of {data.total} APIs &amp; services
        </p>
        <span className="catalogue-sort">sort: recently updated</span>
      </div>

      {data.services.length === 0 ? (
        <EmptyState
          title="No API matches these filters"
          headingLevel={2}
          icon="search-x"
          actions={
            <Button variant="primary" icon="reset" onClick={reset}>
              Reset filters
            </Button>
          }
        >
          <p>None of the {data.total} services matches: {activeDesc.join(' · ')}. Remove a filter or reset the selection.</p>
        </EmptyState>
      ) : view === 'table' ? (
        <DataTable<ServiceSummary> className="catalogue-table" caption="APIs and services" captionHidden columns={columns} rows={data.services} rowKey="id" />
      ) : (
        <div className="catalogue-wall">
          {data.services.map((s) => (
            <article key={s.id} className="catalogue-card">
              <div className="catalogue-card-head">
                <ApiBadge protocol={s.protocol} name={s.name} version={s.version} size="card" className="catalogue-card-badge" />
                <span className="catalogue-format">{s.format} · {pluralize(s.operationCount, operationUnit(s.protocol))}</span>
              </div>
              <div className="catalogue-shields">
                <ApiBadge label="conformance" value={s.conformance === null ? 'untested' : `${s.conformance}%`} status={s.conformance === null ? 'neutral' : levelOf(s.conformance)} />
                <ApiBadge label="mcp" value={s.mcp ? 'agent-ready' : 'not exposed'} status={s.mcp ? 'info' : 'neutral'} />
              </div>
              {labelChips(s)}
              <div className="catalogue-card-foot">
                <span>{callsText(s)} / 24 h · {relative(s.updatedAt)}</span>
                <Button asChild size="sm" variant="secondary">
                  <RouterLink to={`/services/${s.id}`}>
                    Open service<span className="sr-only"> {s.name} {s.version}</span>
                    <Icon name="chevron" size={14} />
                  </RouterLink>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <footer className="catalogue-pager">
        <span>{data.services.length} of {data.total} · page 1 of 1</span>
        <nav aria-label="Pagination" className="catalogue-pager-nav">
          <span className="catalogue-pager-size">20 per page</span>
          <Button size="sm" variant="secondary" icon="chevron-left" iconOnly aria-label="Previous page" disabled className="catalogue-pager-btn" />
          <span className="catalogue-pager-page" aria-current="page">1</span>
          <Button size="sm" variant="secondary" icon="chevron" iconOnly aria-label="Next page" disabled className="catalogue-pager-btn" />
        </nav>
      </footer>
    </div>
  );
}
