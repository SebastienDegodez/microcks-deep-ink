<script lang="ts">
  import { untrack } from 'svelte';
  import {
    ApiBadge,
    Button,
    ButtonLink,
    Callout,
    CodeBlock,
    ConformanceBand,
    DataTable,
    Field,
    Input,
    Panel,
    RunProgress,
    Select,
    StatusBadge,
    Tabs,
    TabPanel,
    type RunSegment,
  } from '@microcks/deep-ink';
  import {
    actualJson,
    mockBase,
    navigate,
    operations,
    pastryJson,
  } from '../data';
  import { demo } from '../model.svelte';
  const services = $derived(demo.services);
  let { path, query }: { path: string; query: URLSearchParams } = $props();
  let serviceId = $state(untrack(() => query.get('service') ?? 'pastry2'));
  let endpoint = $state('https://staging.example.test/api');
  let runner = $state('OPEN_API_SCHEMA');
  let timeout = $state('10000');
  let header = $state('x-microcks-session: demo-session');
  let error = $state('');
  let tab = $state('response');
  let selected = $state('patch-name');
  const creating = $derived(path === '/tests/create');
  const running = $derived(path.startsWith('/tests/runner/'));
  const runId = $derived(path.split('/')[3]);
  const record = $derived(demo.tests.find((t) => t.id === runId));
  const total = $derived(record?.total ?? 4);
  const failed = $derived(record?.result === 'Failed');
  const runOperations = $derived(operations.slice(0, total));
  let done = $state(
    untrack(() =>
      path.startsWith('/tests/runner/') && query.has('live') ? 0 : total,
    ),
  );
  let paused = $state(false);
  const mismatch = $derived(failed && done > 2 && selected === 'patch-name');
  const segments = $derived(
    runOperations.map((_, i): RunSegment =>
      i >= done
        ? i === done
          ? 'current'
          : 'queued'
        : failed && i === 2
          ? 'failed'
          : 'done',
    ),
  );
  $effect(() => {
    if (!running || paused || done >= total) return;
    const timer = setInterval(() => {
      done += 1;
    }, 900);
    return () => clearInterval(timer);
  });
  function start() {
    error = '';
    try {
      const url = new URL(endpoint);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch {
      error = 'Enter a valid HTTP or HTTPS endpoint.';
      return;
    }
    if (!Number.isFinite(Number(timeout)) || Number(timeout) <= 0) {
      error = 'Timeout must be a positive number.';
      return;
    }
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) {
      error = 'Select a known service.';
      return;
    }
    const id = String(Math.max(...demo.tests.map((t) => Number(t.id))) + 1);
    demo.tests.unshift({
      id,
      serviceId,
      service: `${svc.name} ${svc.version}`,
      runner,
      result: 'Failed',
      passed: 3,
      total: 4,
      at: 'just now',
    });
    navigate(`/tests/runner/${id}?live`);
  }
  const historyService = $derived(
    path.startsWith('/tests/service/') ? path.split('/')[3] : '',
  );
  const history = $derived(
    demo.tests.filter((t) => !historyService || t.serviceId === historyService),
  );
</script>

{#snippet resultCell(row: (typeof demo.tests)[number])}<StatusBadge
    status={row.result === 'Failed' ? 'failed' : 'conformant'}
    label={row.result}
  />{/snippet}
<div class="demo-page">
  <header class="demo-page-header">
    <div>
      <p>
        <a href="#/tests">Tests</a>{#if running}
          / Run #{runId}{/if}
      </p>
      <h1 tabindex="-1">
        {creating
          ? 'Run a conformance test'
          : running
            ? `Test run #${runId}`
            : 'Test history'}
      </h1>
      <p class="demo-muted">
        Prove that the implementation honors its contract, operation by
        operation.
      </p>
    </div>
    <ButtonLink href="#/tests/create" variant="primary" icon="play"
      >Run a test</ButtonLink
    >
  </header>
  {#if creating}
    <div class="demo-two">
      <Panel title="Test configuration"
        ><form
          class="demo-form"
          onsubmit={(e) => {
            e.preventDefault();
            start();
          }}
        >
          <Field label="API / service" required
            >{#snippet children(p)}<Select {...p} bind:value={serviceId}
                >{#each services as s}<option value={s.id}
                    >{s.name} {s.version}</option
                  >{/each}</Select
              >{/snippet}</Field
          >
          <Field
            label="Implementation endpoint"
            help="The prototype simulates a staging implementation; no request is sent."
            required
            >{#snippet children(p)}<Input
                {...p}
                type="url"
                bind:value={endpoint}
              />{/snippet}</Field
          >
          <Field label="Runner"
            >{#snippet children(p)}<Select {...p} bind:value={runner}
                ><option>OPEN_API_SCHEMA</option><option>HTTP</option><option
                  >ASYNC_API_SCHEMA</option
                ><option>GRPC_PROTOBUF</option></Select
              >{/snippet}</Field
          >
          <Field label="Timeout (ms)"
            >{#snippet children(p)}<Input
                {...p}
                type="number"
                min="1"
                bind:value={timeout}
              />{/snippet}</Field
          >
          <Field label="Secret"
            >{#snippet children(p)}<Select {...p}
                ><option value="">None</option>{#each demo.secrets as s}<option
                    >{s.name}</option
                  >{/each}</Select
              >{/snippet}</Field
          >
          <Field label="Request header"
            >{#snippet children(p)}<Input
                {...p}
                bind:value={header}
                mono
              />{/snippet}</Field
          >
          {#if error}<p role="alert">{error}</p>{/if}<Button
            type="submit"
            variant="primary"
            icon="play">Start test</Button
          >
        </form></Panel
      >
      <div class="demo-stack">
        <Callout title="In-memory test runner"
          >The sample staging mismatch: PATCH returns price as a string instead
          of a number.</Callout
        ><CodeBlock
          caption="CLI · generated live"
          language="shell"
          code={`microcks-cli test '${services.find((s) => s.id === serviceId)?.name}:${services.find((s) => s.id === serviceId)?.version}' '${endpoint}' ${runner} --timeout=${timeout}`}
        /><CodeBlock
          caption="GitHub Actions"
          language="yaml"
          code={`- uses: microcks/test-github-action@v1\n  with:\n    service-id: "${serviceId}"\n    test-endpoint: "${endpoint}"\n    runner: "${runner}"`}
        />
      </div>
    </div>
  {:else if running}
    {#if !record}<Callout title="Test run not found"
        >This run does not exist in this session.</Callout
      >
    {:else}
      <div class="demo-actions">
        <ApiBadge protocol="REST" name={record.service} /><StatusBadge
          status={done < total ? 'running' : failed ? 'failed' : 'conformant'}
        /><span class="demo-code">{record.runner}</span><Button
          onclick={() => {
            done = 0;
            paused = false;
          }}>Replay run</Button
        ><Button disabled={done >= total} onclick={() => (paused = !paused)}
          >{paused ? 'Resume' : 'Pause'}</Button
        ><Button
          disabled={done >= total}
          onclick={() => {
            paused = true;
            done += 1;
          }}>Step forward</Button
        >
      </div>
      <RunProgress
        {done}
        {total}
        caption="operations checked"
        now={done < total
          ? `${runOperations[done].method} ${runOperations[done].path}`
          : failed
            ? 'Finished · schema mismatch'
            : 'Finished · all checks passed'}
        {segments}
        counts={[
          {
            kind: 'pass',
            text: `${failed && done > 2 ? done - 1 : done} passed`,
          },
          { kind: 'fail', text: failed && done > 2 ? '1 failed' : '0 failed' },
        ]}
      />
      <div class="demo-two">
        <Panel title="Operations"
          ><DataTable
            caption="Operation results"
            rowKey="id"
            onrowselect={(r) => (selected = r.id)}
            selectedKey={selected}
            columns={[
              { key: 'path', header: 'Operation', rowHeader: true },
              { key: 'method', header: 'Method' },
              { key: 'result', header: 'Result' },
            ]}
            rows={runOperations.map((o, i) => ({
              ...o,
              result:
                i >= done ? 'Queued' : failed && i === 2 ? 'Failed' : 'Passed',
            }))}
          /></Panel
        ><Panel
          title={mismatch
            ? 'PATCH · price schema mismatch'
            : 'Operation response'}
          ><Tabs
            label="Result detail"
            bind:value={tab}
            items={[
              { id: 'response', label: 'Response diff' },
              { id: 'criteria', label: 'Checks' },
              { id: 'request', label: 'Request' },
            ]}
            ><TabPanel id="response" value={tab}
              ><div class="demo-tab-content">
                <CodeBlock
                  caption="Contract · expected"
                  code={pastryJson}
                  language="json"
                /><CodeBlock
                  caption="Implementation · actual"
                  code={mismatch ? actualJson : pastryJson}
                  language="json"
                  tone={mismatch ? 'danger' : undefined}
                />
              </div></TabPanel
            ><TabPanel id="criteria" value={tab}
              ><div class="demo-tab-content">
                <Callout
                  title={mismatch
                    ? 'Schema validation failed'
                    : 'Checks passed'}
                  >{mismatch
                    ? '$.price: expected number, received string "3.9". HTTP 200 and success criteria passed.'
                    : 'HTTP status, content type and response schema match.'}</Callout
                >
              </div></TabPanel
            ><TabPanel id="request" value={tab}
              ><div class="demo-tab-content">
                <CodeBlock
                  caption="Request"
                  code={`${operations.find((o) => o.id === selected)?.method} ${mockBase}/pastries/Millefeuille\nAccept: application/json`}
                />
              </div></TabPanel
            ></Tabs
          ></Panel
        >
      </div>
    {/if}
  {:else}
    <Panel title="Conformance trend"
      ><ConformanceBand
        outcomes={['pass', 'pass', 'fail', 'pass', 'pass', 'pass', 'fail']}
      />
      <p class="demo-muted">
        The most recent Pastry run fails schema validation on PATCH.
      </p></Panel
    >
    <DataTable
      caption="Conformance test history"
      rowKey="id"
      rowHref={(r) => `#/tests/runner/${r.id}`}
      columns={[
        { key: 'id', header: 'Run' },
        { key: 'service', header: 'API / service' },
        { key: 'runner', header: 'Runner' },
        { key: 'result', header: 'Result', render: resultCell },
        { key: 'passed', header: 'Passed' },
        { key: 'total', header: 'Total' },
        { key: 'at', header: 'When' },
      ]}
      rows={history}
    />
  {/if}
</div>
