<script lang="ts">
  import '@microcks/demo-styles/pages/explore-kit/explore.css';
  import '@microcks/demo-styles/pages/catalogue/catalogue.css';
  import { labelFromString, labelToString, type ServiceSummary } from '@microcks/demo-core/domain/shared';
  import type { ServiceFilter } from '@microcks/demo-core/domain/catalog';
  import { ApiBadge, Button, Chip, ConformanceBand, DataTable, type DataTableColumn, EmptyState, FilterBar, FilterReset, FilterRow, FilterSearch, Icon, Segmented, StatusBadge } from '@microcks/deep-ink';
  import { ButtonRouterLink, PageHeader, RouterLink, usePageTitle, useQuery, useRelativeTime, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import { PROTOCOL_ORDER, operationUnit, pluralize } from '@/ui/app/format';
  import { serviceOutcomes } from '@/ui/app/outcomes';
  import { FEATURED_LABELS, TEST_WORD, activeFilterCount, activeFilterWords, callsText, lastTestText, levelOf, outcomeOf, testsHref } from './listing';

  /** `/services`: the catalogue of APIs and services, filtered by name, protocol, label and last test result. */
  usePageTitle('APIs & Services · Microcks');
  const uc = useUseCases();
  const relative = useRelativeTime();
  const noFilter = (): ServiceFilter => ({ query: '', protocols: [], labels: [], testStatus: 'all' });
  let filter = $state.raw<ServiceFilter>(noFilter());
  let view = $state<'table' | 'wall'>('table');
  const view$ = useQuery(
    () => uc.catalog.browse(filter),
    () => [uc, filter.query, filter.testStatus, (filter.protocols ?? []).join(), (filter.labels ?? []).join()],
  );
  const labels$ = useQuery(() => uc.catalog.labels(), () => [uc]);

  const toggle = (key: 'protocols' | 'labels', value: string) => {
    const cur = filter[key] ?? [];
    filter = { ...filter, [key]: cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value] };
  };
  const reset = () => (filter = noFilter());
  const activeCount = $derived(activeFilterCount(filter));
  const activeDesc = $derived(activeFilterWords(filter));

  const data = $derived(view$.data);
  const labelNames = $derived.by(() => {
    const known = new Set((labels$.data ?? []).map((l) => labelToString(l.label)));
    return FEATURED_LABELS.filter((l) => known.has(l));
  });

  const columns: DataTableColumn<ServiceSummary>[] = [
    { key: 'name', header: 'API / service', render: nameCell },
    { key: 'ops', header: 'Ops', align: 'end', mono: true, render: opsCell },
    { key: 'labels', header: 'Labels', render: labelChips },
    { key: 'test', header: 'Last test', nowrap: true, render: testCell },
    { key: 'conformance', header: 'Conformance', render: conformanceCell },
    { key: 'calls', header: 'Mock 24 h', align: 'end', mono: true, nowrap: true, render: callsCell },
    { key: 'updated', header: 'Updated', nowrap: true, render: updatedCell },
    { key: 'open', header: 'Open', headerHidden: true, align: 'end', render: openCell },
  ];
</script>

{#snippet actions()}<ButtonRouterLink variant="secondary" icon="plus" to="/sources/new">Direct API</ButtonRouterLink>{/snippet}

{#snippet labelChips(s: ServiceSummary)}<span class="catalogue-labels"
    >{#each s.labels as l (labelToString(l))}<Chip size="sm" labelKey={l.key} class="catalogue-label-chip">{l.value}</Chip>{/each}</span
  >{/snippet}

{#snippet nameCell(s: ServiceSummary)}<span class="catalogue-service"
    ><RouterLink to={`/services/${s.id}`} class="catalogue-badge-link"><ApiBadge protocol={s.protocol} name={s.name} version={s.version} /></RouterLink
    ><span class="catalogue-format">{s.format}</span></span
  >{/snippet}

{#snippet opsCell(s: ServiceSummary)}{s.operationCount}{/snippet}

{#snippet testCell(s: ServiceSummary)}<RouterLink to={testsHref(s)} class="catalogue-test"
    ><span class="sr-only">Tests of <!---->{s.name}<!---->{' '}<!---->{s.version}<!---->{': '}</span><StatusBadge
      status={outcomeOf(s)}
      label={TEST_WORD[s.testStatus]}
    /><span class="sr-only">{', '}</span><span class="catalogue-test-meta">{lastTestText(s, relative)}</span></RouterLink
  >{/snippet}

{#snippet conformanceCell(s: ServiceSummary)}<span class="catalogue-conformance"
    ><span class="catalogue-score" data-level={levelOf(s.conformance)}>{s.conformance === null ? '—' : `${s.conformance}%`}</span><ConformanceBand
      size="mini"
      outcomes={serviceOutcomes(s)}
      unit={operationUnit(s.protocol)}
    /></span
  >{/snippet}

{#snippet callsCell(s: ServiceSummary)}{callsText(s)}{/snippet}

{#snippet updatedCell(s: ServiceSummary)}<span class="ex-muted">{relative(s.updatedAt)}</span>{/snippet}

{#snippet openCell(s: ServiceSummary)}<RouterLink to={`/services/${s.id}`} class="catalogue-open" aria-label={`Open ${s.name} ${s.version}`}
    ><Icon name="chevron" size={14} /></RouterLink
  >{/snippet}

{#if view$.status === 'error' && !data}<PageHeader title="APIs & Services" {actions} /><ErrorBlock
    error={view$.error}
    what="The catalogue"
    onretry={view$.reload}
  />{:else if !data}<PageHeader title="APIs & Services" {actions} /><LoadingBlock label="the catalogue" />{:else}
  {#snippet meta()}{data.total}<!----> services · <!---->{data.operationsTotal}<!----> operations · <RouterLink to="/workflows"
      >used by <!---->{data.workflowsUsing}<!----> workflows</RouterLink
    >{/snippet}
  {#snippet resetButton()}<Button variant="primary" icon="reset" onclick={reset}>Reset filters</Button>{/snippet}
  <div class="catalogue" data-main-pad="roomy"
    ><PageHeader
      title="APIs & Services"
      size="lg"
      {meta}
      description="Every imported contract becomes a live mock and a test target. Filter by protocol, by label or by last test result."
      {actions}
    /><FilterBar label="Catalogue filters" aria-busy={view$.status === 'loading'}
      ><FilterRow
        ><FilterSearch
          label="Filter by name"
          placeholder="Filter by name or version…"
          autocomplete="off"
          value={filter.query ?? ''}
          oninput={(e) => (filter = { ...filter, query: e.currentTarget.value })}
        /><Segmented
          label="Last test result"
          value={filter.testStatus ?? 'all'}
          onchange={(id) => (filter = { ...filter, testStatus: id as ServiceFilter['testStatus'] })}
          options={[
            { id: 'all', label: 'All', dot: 'neutral', count: data.facets.testStatus.all },
            { id: 'passed', label: 'Conformant', dot: 'success', count: data.facets.testStatus.passed },
            { id: 'failed', label: 'Failing', dot: 'danger', count: data.facets.testStatus.failed },
            { id: 'never', label: 'Never tested', dot: 'muted', count: data.facets.testStatus.never },
          ]}
        /><Segmented
          class="filter-bar-end"
          label="View mode"
          value={view}
          onchange={(id) => (view = id as 'table' | 'wall')}
          options={[
            { id: 'table', label: 'Table', icon: 'list' },
            { id: 'wall', label: 'Badge wall', icon: 'badge-wall' },
          ]}
        /></FilterRow
      ><FilterRow title="Protocol"
        >{#each PROTOCOL_ORDER as p (p)}<Chip
            protocol={p}
            count={data.facets.protocols[p] ?? 0}
            pressed={(filter.protocols ?? []).includes(p)}
            onclick={() => toggle('protocols', p)}>{p}</Chip
          >{/each}</FilterRow
      ><FilterRow title="Labels"
        >{#each labelNames as l (l)}{@const label = labelFromString(l)}<Chip
            labelKey={label.key}
            count={data.facets.labels[l] ?? 0}
            pressed={(filter.labels ?? []).includes(l)}
            onclick={() => toggle('labels', l)}>{label.value}</Chip
          >{/each}{#if activeCount > 0}<FilterReset count={activeCount} onclick={reset} />{/if}</FilterRow
      ></FilterBar
    ><div class="catalogue-result"
      ><p role="status" aria-live="polite" data-testid="result-count"
        ><strong>{data.services.length}</strong> of <!---->{data.total}<!----> APIs &amp; services</p
      ><span class="catalogue-sort">sort: recently updated</span></div
    >{#if data.services.length === 0}<EmptyState title="No API matches these filters" headingLevel={2} icon="search-x" actions={resetButton}
        ><p>None of the <!---->{data.total}<!----> services matches: <!---->{activeDesc.join(' · ')}<!---->. Remove a filter or reset the selection.</p
        ></EmptyState
      >{:else if view === 'table'}<DataTable
        class="catalogue-table"
        caption="APIs and services"
        captionHidden
        {columns}
        rows={data.services}
        rowKey="id"
      />{:else}<div class="catalogue-wall"
        >{#each data.services as s (s.id)}<article class="catalogue-card"
            ><div class="catalogue-card-head"
              ><ApiBadge protocol={s.protocol} name={s.name} version={s.version} size="card" class="catalogue-card-badge" /><span class="catalogue-format"
                >{s.format}<!----> · <!---->{pluralize(s.operationCount, operationUnit(s.protocol))}</span
              ></div
            ><div class="catalogue-shields"
              ><ApiBadge
                label="conformance"
                value={s.conformance === null ? 'untested' : `${s.conformance}%`}
                status={s.conformance === null ? 'neutral' : levelOf(s.conformance)}
              /><ApiBadge label="mcp" value={s.mcp ? 'agent-ready' : 'not exposed'} status={s.mcp ? 'info' : 'neutral'} /></div
            >{@render labelChips(s)}<div class="catalogue-card-foot"
              ><span>{callsText(s)}<!----> / 24 h · <!---->{relative(s.updatedAt)}</span><ButtonRouterLink size="sm" variant="secondary" to={`/services/${s.id}`}
                >Open service<span class="sr-only">{' '}<!---->{s.name}<!---->{' '}<!---->{s.version}</span><Icon name="chevron" size={14} /></ButtonRouterLink
              ></div
            ></article
          >{/each}</div
      >{/if}<footer class="catalogue-pager"
      ><span>{data.services.length}<!----> of <!---->{data.total}<!----> · page 1 of 1</span><nav aria-label="Pagination" class="catalogue-pager-nav"
        ><span class="catalogue-pager-size">20 per page</span><Button
          size="sm"
          variant="secondary"
          icon="chevron-left"
          iconOnly
          aria-label="Previous page"
          disabled
          class="catalogue-pager-btn"
        /><span class="catalogue-pager-page" aria-current="page">1</span><Button
          size="sm"
          variant="secondary"
          icon="chevron"
          iconOnly
          aria-label="Next page"
          disabled
          class="catalogue-pager-btn"
        /></nav
      ></footer
    ></div
  >
{/if}
