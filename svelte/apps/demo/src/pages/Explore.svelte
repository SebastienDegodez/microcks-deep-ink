<script lang="ts">
  import {
    ApiBadge,
    BarChart,
    Button,
    ButtonLink,
    Chip,
    ConformanceBand,
    DataTable,
    EmptyState,
    FilterBar,
    FilterRow,
    FilterSearch,
    Panel,
    Segmented,
    StatCard,
    StatGrid,
    StatusBadge,
  } from '@microcks/deep-ink';
  import { protocols, outcomes, screens, type Service } from '../data';
  import { demo } from '../model.svelte';
  const services = $derived(demo.services);
  let { path }: { path: string } = $props();
  let query = $state('');
  let protocol = $state('');
  let domain = $state('');
  let result = $state('all');
  let view = $state('table');
  let empty = $state(false);
  let hour = $state('11');
  const filtered = $derived(
    (empty ? [] : services).filter(
      (s) =>
        `${s.name} ${s.version}`.toLowerCase().includes(query.toLowerCase()) &&
        (!protocol || s.protocol === protocol) &&
        (!domain || s.domain === domain) &&
        (result === 'all' ||
          (result === 'passed'
            ? s.score === 100
            : result === 'failed'
              ? s.score !== null && s.score < 100
              : s.score === null)),
    ),
  );
  const phases = [...new Set(screens.map((s) => s.phase))];
  const hours = [5, 1, 2, 1, 1, 6, 15, 40, 92, 121, 165, 125];
</script>

{#snippet serviceCell(s: Service)}<a
    href={`#/services/${s.id}`}
    class="demo-badge-link"
    ><ApiBadge protocol={s.protocol} name={s.name} version={s.version} /></a
  ><small class="demo-muted">{s.format}</small>{/snippet}
{#snippet labels(s: Service)}<Chip labelKey="domain" size="sm">{s.domain}</Chip
  >{/snippet}
{#snippet score(s: Service)}<div class="demo-score">
    <strong>{s.score === null ? '—' : `${s.score}%`}</strong><ConformanceBand
      size="mini"
      outcomes={outcomes(s)}
    />
  </div>{/snippet}
{#snippet status(s: Service)}<a href={`#/tests/service/${s.id}`}
    ><StatusBadge
      status={s.score === null
        ? 'never'
        : s.score === 100
          ? 'conformant'
          : 'failed'}
    /></a
  >{/snippet}
{#snippet catalogue()}
  <FilterBar label="Catalogue filters">
    <FilterRow
      ><FilterSearch
        label="Filter by name"
        placeholder="Filter by name or version..."
        value={query}
        oninput={(e) => (query = e.currentTarget.value)}
      />
      <Segmented
        label="Last test result"
        bind:value={result}
        options={[
          { id: 'all', label: 'All' },
          { id: 'passed', label: 'Conformant' },
          { id: 'failed', label: 'Failing' },
          { id: 'never', label: 'Never tested' },
        ]}
      />
      <Segmented
        label="View mode"
        bind:value={view}
        options={[
          { id: 'table', label: 'Table', icon: 'list' },
          { id: 'wall', label: 'Badge wall', icon: 'badge-wall' },
        ]}
      />
    </FilterRow>
    <FilterRow title="Protocol"
      >{#each protocols as p}<Chip
          protocol={p}
          count={services.filter((s) => s.protocol === p).length}
          pressed={protocol === p}
          onclick={() => (protocol = protocol === p ? '' : p)}>{p}</Chip
        >{/each}</FilterRow
    >
    <FilterRow title="Labels"
      >{#each ['pastry', 'movies', 'platform'] as d}<Chip
          labelKey="domain"
          pressed={domain === d}
          onclick={() => (domain = domain === d ? '' : d)}>{d}</Chip
        >{/each}<Button
        size="sm"
        variant="ghost"
        onclick={() => {
          query = '';
          protocol = '';
          domain = '';
          result = 'all';
        }}>Reset filters</Button
      ></FilterRow
    >
  </FilterBar>
  <p role="status">
    <strong>{filtered.length}</strong> of {services.length} APIs &amp; services
  </p>
  {#if filtered.length === 0}<EmptyState
      title="No API matches these filters"
      icon="search-x"
    />
  {:else if view === 'wall'}<div class="demo-wall">
      {#each filtered as s}<Panel
          ><a href={`#/services/${s.id}`} class="demo-badge-link"
            ><ApiBadge
              protocol={s.protocol}
              name={s.name}
              version={s.version}
              size="card"
            /></a
          >
          <p class="demo-muted">
            {s.operations} operations · {s.calls} requests today
          </p>
          {@render score(s)}</Panel
        >{/each}
    </div>
  {:else}<DataTable
      caption="APIs & services"
      captionHidden
      columns={[
        { key: 'name', header: 'API / service', render: serviceCell },
        { key: 'operations', header: 'Ops', align: 'end', mono: true },
        { key: 'domain', header: 'Labels', render: labels },
        { key: 'status', header: 'Last test', render: status },
        { key: 'score', header: 'Conformance', render: score },
        { key: 'calls', header: 'Mock 24 h', align: 'end', mono: true },
      ]}
      rows={filtered}
      rowKey="id"
    />{/if}
{/snippet}

<div class="demo-page">
  <header class="demo-page-header">
    <div>
      <h1 tabindex="-1">
        {path === '/map'
          ? 'The 19-screen journey'
          : path === '/services'
            ? 'APIs & Services'
            : 'Cockpit'}
      </h1>
      <p class="demo-muted">
        {path === '/map'
          ? 'The contract comes in. The interface makes it alive.'
          : path === '/services'
            ? 'Every imported contract becomes a live mock and a test target.'
            : 'microcks.local:8080 · Tuesday, Nov 3, 2026 · 09:10 · 3 mocks live, 2 items need attention'}
      </p>
    </div>
    <div class="demo-actions">
      {#if path === '/'}<Button
          variant="dashed"
          icon="window"
          aria-pressed={empty}
          onclick={() => (empty = !empty)}
          >{empty ? 'Back to running instance' : 'Show empty install'}</Button
        >{/if}<ButtonLink href="#/tests/create" variant="primary" icon="play"
        >Run a test</ButtonLink
      >
    </div>
  </header>
  {#if path === '/map'}
    {#each phases as phase}<Panel title={phase}
        ><div class="demo-wall">
          {#each screens.filter((s) => s.phase === phase) as screen}<a
              class="demo-map-card"
              href={`#${screen.href}`}
              ><span class="demo-muted">{screen.n}</span><strong
                >{screen.title}</strong
              ><small>{screen.detail}</small></a
            >{/each}
        </div></Panel
      >{/each}
  {:else if path === '/services'}
    {@render catalogue()}
  {:else}
    <StatGrid label="Key figures">
      <StatCard
        title="APIs & services"
        value={empty ? '0' : String(services.length)}
        unit="25 operations"
        ><ButtonLink href="#/services" variant="link">Catalogue →</ButtonLink
        ></StatCard
      >
      <StatCard
        title="Mock invocations today"
        value={empty ? '0' : '2,412'}
        unit="requests"
        ><p class="demo-muted">864 async messages published</p></StatCard
      >
      <StatCard
        title="Tests · last 7 days"
        value={empty ? '0' : '27'}
        unit="runs"
        ><StatusBadge status="conformant" label="23 passed" /><StatusBadge
          status="failed"
          label="4 failed"
        /></StatCard
      >
      <StatCard
        title="Average conformance"
        value={empty ? '—' : '81%'}
        unit="current score"
        tone="warning"
        ><ConformanceBand
          outcomes={empty ? [] : ['pass', 'pass', 'pass', 'pass', 'fail']}
        /></StatCard
      >
    </StatGrid>
    {#if empty}<Panel title="Start with a contract"
        ><p>
          Import a contract, call the mock, then prove your implementation
          conforms.
        </p>
        <ButtonLink href="#/sources/new" variant="primary"
          >Import a contract</ButtonLink
        ></Panel
      >
    {:else}
      <div class="demo-two">
        <Panel title="Needs attention"
          ><a href="#/tests/runner/119"
            ><StatusBadge status="failed" /> API Pastry 2.0 · price is a string, expected
            number</a
          >
          <p>
            <a href="#/workflows">1 workflow has an unresolved source</a>
          </p></Panel
        ><Panel title="Mock traffic today"
          ><BarChart
            label="Mock requests per hour"
            bars={hours.map((value, i) => ({
              id: String(i),
              label: `${i}:00`,
              value,
              description: `${i}:00: ${value} requests`,
            }))}
            max={165}
            selectedId={hour}
            onselect={(id) => (hour = id)}
            table={{
              caption: 'Hourly requests',
              columns: ['Hour', 'Requests'],
              rows: hours.map((v, i) => [String(i), String(v)]),
            }}
          />
          <p class="demo-muted">
            {hour}:00 · {hours[Number(hour)]} requests
          </p></Panel
        >
      </div>
      <Panel title="Your API landscape" flush>{@render catalogue()}</Panel>
      <div class="demo-two">
        <Panel title="Recent tests"
          ><DataTable
            caption="Recent test runs"
            captionHidden
            rowKey="id"
            rowHref={(r) => `#/tests/runner/${r.id}`}
            columns={[
              { key: 'id', header: 'Run' },
              { key: 'service', header: 'Service' },
              { key: 'result', header: 'Result' },
            ]}
            rows={[
              {
                id: '119',
                service: 'API Pastry 2.0',
                result: 'Failed · 3/4 operations',
              },
              {
                id: '118',
                service: 'Pastry orders API',
                result: 'Passed · 2/2 operations',
              },
            ]}
          /></Panel
        ><Panel title="Recent mock calls"
          ><DataTable
            caption="Recent calls"
            captionHidden
            rowKey="id"
            rowHref={() => '#/traces'}
            columns={[
              { key: 'time', header: 'Time' },
              { key: 'path', header: 'Operation' },
              { key: 'status', header: 'Response' },
            ]}
            rows={[
              {
                id: '1',
                time: '09:10:04',
                path: 'GET /pastries/Millefeuille',
                status: '200 · 24 ms',
              },
              {
                id: '2',
                time: '09:10:02',
                path: 'PATCH /pastries/Millefeuille',
                status: '200 · 31 ms',
              },
            ]}
          /></Panel
        >
      </div>
    {/if}
  {/if}
</div>
