<script lang="ts">
  import {
    ApiBadge,
    BarChart,
    Button,
    ButtonLink,
    CodeBlock,
    ConformanceBand,
    DataTable,
    Field,
    LiveIndicator,
    Panel,
    Select,
    StatCard,
    StatGrid,
  } from '@microcks/deep-ink';
  import { untrack } from 'svelte';
  import { operations, pastryJson, outcomes } from '../data';
  import { demo } from '../model.svelte';
  const services = $derived(demo.services);
  let { path }: { path: string } = $props();
  const tracing = $derived(path === '/traces');
  let serviceId = $state(untrack(() => path.split('/')[2] || 'pastry2'));
  let hour = $state('11');
  let paused = $state(false);
  let selected = $state('call-1');
  let replay = $state(false);
  let count = $state(0);
  let calls = $state([
    {
      id: 'call-1',
      time: '09:10:04',
      method: 'GET',
      path: '/pastries/Millefeuille',
      status: '200',
      ms: 24,
    },
    {
      id: 'call-2',
      time: '09:10:02',
      method: 'PATCH',
      path: '/pastries/Millefeuille',
      status: '200',
      ms: 31,
    },
    {
      id: 'call-3',
      time: '09:09:58',
      method: 'GET',
      path: '/pastries',
      status: '200',
      ms: 12,
    },
  ]);
  const svc = $derived(services.find((s) => s.id === serviceId) ?? services[0]);
  const hours = [
    5, 1, 2, 1, 1, 6, 15, 40, 92, 121, 165, 125, 102, 87, 91, 64, 32, 16, 10, 8,
    4, 3, 2, 1,
  ];
  $effect(() => {
    if (!tracing || paused) return;
    const timer = setInterval(() => {
      count += 1;
      calls = [
        {
          id: `live-${count}`,
          time: new Date(Date.UTC(2026, 10, 3, 9, 10, 4 + count))
            .toISOString()
            .slice(11, 19),
          method: 'GET',
          path: '/pastries/Millefeuille',
          status: '200',
          ms: 24,
        },
        ...calls,
      ].slice(0, 10);
    }, 2500);
    return () => clearInterval(timer);
  });
</script>

<div class="demo-page">
  <header class="demo-page-header">
    <div>
      <h1 tabindex="-1">{tracing ? 'Live traces' : 'Usage & conformance'}</h1>
      <p class="demo-muted">
        {tracing
          ? 'Follow mock calls, inspect the request and replay an example.'
          : 'Understand how your mocks are used and how implementations conform.'}
      </p>
    </div>
    {#if tracing}<div class="demo-actions">
        <LiveIndicator {paused} /><Button onclick={() => (paused = !paused)}
          >{paused ? 'Resume' : 'Pause'}</Button
        >
      </div>{:else}<Field label="Service"
        >{#snippet children(p)}<Select {...p} bind:value={serviceId}
            >{#each services as s}<option value={s.id}
                >{s.name} {s.version}</option
              >{/each}</Select
          >{/snippet}</Field
      >{/if}
  </header>
  {#if tracing}
    <div class="demo-two">
      <Panel title="Mock calls" flush
        ><DataTable
          caption="Recent mock calls"
          captionHidden
          rowKey="id"
          selectedKey={selected}
          onrowselect={(r) => {
            selected = r.id;
            replay = false;
          }}
          columns={[
            { key: 'time', header: 'Time', rowHeader: true },
            { key: 'method', header: 'Method' },
            { key: 'path', header: 'Path' },
            { key: 'status', header: 'Status' },
            { key: 'ms', header: 'ms' },
          ]}
          rows={calls}
        /></Panel
      ><Panel title={`Call inspector · ${selected}`}
        ><p class="demo-code">
          Client → API Pastry mock → Millefeuille example
        </p>
        <CodeBlock caption="Response" language="json" code={pastryJson} />
        <div class="demo-actions">
          <Button onclick={() => (replay = true)} icon="play"
            >Replay call</Button
          ><ButtonLink href="#/services/pastry2">Open example</ButtonLink>
        </div>
        {#if replay}<p role="status">
            Replay completed (simulated): HTTP 200 · 24 ms
          </p>{/if}</Panel
      >
    </div>
  {:else}
    <div class="demo-actions">
      <ApiBadge protocol={svc.protocol} name={svc.name} version={svc.version} />
    </div>
    <StatGrid label="Usage figures"
      ><StatCard
        title="Mock invocations today"
        value={String(svc.calls)}
        unit="requests"
      /><StatCard title="Average latency" value="24" unit="ms" /><StatCard
        title="Conformance"
        value={svc.score === null ? '—' : `${svc.score}%`}
        tone={svc.score === 100 ? 'success' : 'warning'}
      /><StatCard title="Last test" value="#119" unit="2 min ago" /></StatGrid
    >
    <Panel title="Hourly invocations"
      ><BarChart
        label="Mock invocations by hour"
        bars={hours.map((value, i) => ({
          id: String(i),
          value,
          description: `${i}:00 · ${value} requests`,
        }))}
        max={165}
        selectedId={hour}
        onselect={(id) => (hour = id)}
        ticks={['00:00', '06:00', '12:00', '18:00', '23:00']}
        table={{
          caption: 'Hourly invocations',
          columns: ['Hour', 'Requests'],
          rows: hours.map((v, i) => [String(i), String(v)]),
        }}
      />
      <p role="status">{hour}:00 · {hours[Number(hour)]} requests</p></Panel
    >
    <Panel title="Conformance by operation"
      ><ConformanceBand outcomes={outcomes(svc)} /><DataTable
        caption="Operation usage"
        rowKey="id"
        rowHref={(o) => `#/services/${svc.id}/operations/${o.id}`}
        columns={[
          { key: 'method', header: 'Method' },
          { key: 'path', header: 'Operation' },
          { key: 'calls', header: 'Calls / 24 h' },
          { key: 'dispatcher', header: 'Dispatcher' },
        ]}
        rows={operations}
      /><ButtonLink href={`#/tests/service/${svc.id}`}
        >Open test history</ButtonLink
      ></Panel
    >
  {/if}
</div>
