<script lang="ts">
  import { untrack } from 'svelte';
  import {
    ApiBadge,
    Button,
    ButtonLink,
    Callout,
    CodeBlock,
    DataTable,
    Field,
    Panel,
    RunProgress,
    Select,
    StatusBadge,
    Tabs,
    TabPanel,
    WorkflowLoom,
    type LoomSource,
    type LoomStep,
    type LoomThread,
  } from '@microcks/deep-ink';
  import { navigate, run14 } from '../data';
  import { demo } from '../model.svelte';
  let { path }: { path: string } = $props();
  const list = $derived(path === '/workflows');
  const running = $derived(path.startsWith('/workflows/runs/'));
  let selected = $state('patchPastry');
  let tab = $state('loom');
  const target = $derived(demo.workflowTarget);
  const linked = $derived(demo.workflowSourcesLinked);
  let notice = $state('');
  const failed = $derived(target !== 'mocks');
  const limit = $derived(failed ? 3 : 4);
  let done = $state(untrack(() => (demo.workflowTarget === 'mocks' ? 4 : 3)));
  let paused = $state(false);
  const sources: LoomSource[] = [
    {
      name: 'pastry',
      type: 'openapi',
      protocol: 'REST',
      linked: true,
      serviceLabel: 'API Pastry 2.0',
    },
    {
      name: 'stock',
      type: 'openapi',
      protocol: 'REST',
      linked: true,
      serviceLabel: 'Stock API',
    },
  ];
  const steps = $derived<LoomStep[]>([
    {
      stepId: 'getPastry',
      source: 'pastry',
      operation: 'getPastryByName',
      method: 'GET',
      path: '/pastries/{name}',
      status: running && done >= 1 ? 'passed' : undefined,
    },
    {
      stepId: 'checkStock',
      source: 'stock',
      operation: 'getStock',
      method: 'GET',
      path: '/stock/{name}',
      dependsOn: ['getPastry'],
      status: running && done >= 2 ? 'passed' : undefined,
    },
    {
      stepId: 'patchPastry',
      source: 'pastry',
      operation: 'patchPastry',
      method: 'PATCH',
      path: '/pastries/{name}',
      dependsOn: ['checkStock'],
      status: running && done >= 3 ? (failed ? 'failed' : 'passed') : undefined,
      attempts: failed ? 3 : 1,
      checks:
        running && done >= 3
          ? {
              successCriteria: 'passed',
              schemaValidation: failed ? 'failed' : 'passed',
            }
          : undefined,
      actions: [
        {
          type: 'retry',
          name: 'retryPatch',
          on: 'failure',
          retryAfter: 1,
          retryLimit: 2,
          applied: running && failed && done >= 3,
        },
      ],
    },
    {
      stepId: 'verifyPastry',
      source: 'pastry',
      operation: 'getPastryByName',
      method: 'GET',
      path: '/pastries/{name}',
      dependsOn: ['patchPastry'],
      status: running ? (done >= 4 ? 'passed' : 'not-run') : undefined,
    },
  ]);
  const threads: LoomThread[] = [
    {
      from: 'getPastry',
      to: 'checkStock',
      expression: '$steps.getPastry.outputs.name',
      value: 'Millefeuille',
    },
    {
      from: 'checkStock',
      to: 'patchPastry',
      expression: '$steps.checkStock.outputs.quantity',
      value: '24',
    },
    {
      from: 'patchPastry',
      to: 'verifyPastry',
      expression: '$steps.patchPastry.outputs.name',
    },
  ];
  $effect(() => {
    if (!running || paused || done >= limit) return;
    const timer = setInterval(() => (done += 1), 1000);
    return () => clearInterval(timer);
  });
</script>

<div class="demo-page">
  <header class="demo-page-header">
    <div>
      <p>
        <a href="#/workflows">Workflows</a>{#if !list}
          / pastry / restock-pastry{/if}
      </p>
      <h1 tabindex="-1">
        {list ? 'Workflows' : running ? 'Workflow run #14' : 'restock-pastry'}
      </h1>
      <p class="demo-muted">
        Weave API contracts into workflows. Arazzo 1.1.0 · 4 steps · 2 sources.
      </p>
    </div>
    <div class="demo-actions">
      <ButtonLink href="#/sources/new" icon="download">Import Arazzo</ButtonLink
      >{#if !list}<Button
          variant="primary"
          icon="play"
          onclick={() => navigate(`/workflows/runs/${run14}`)}
          >Run workflow</Button
        >{/if}
    </div>
  </header>
  {#if notice}<p role="status">{notice}</p>{/if}
  {#if list}
    <Callout title={linked ? 'All sources linked' : 'One unresolved source'}
      >{linked
        ? 'beerCatalog is now linked for this session.'
        : 'beerCatalog must be linked to a service before check-menu can run.'}</Callout
    >
    <div class="demo-wall">
      {#each [{ id: 'restock-pastry', description: 'Check stock, update pastry, verify the result', count: 4 }, { id: 'check-menu', description: 'Check the pastry menu and beer catalogue', count: 3 }, { id: 'order-pastry', description: 'Publish the order over AsyncAPI', count: 3 }] as w}<Panel
          title={w.id}
          ><ApiBadge arazzo name="pastry" version="1.1.0" />
          <p class="demo-muted">{w.description}</p>
          <p>
            {w.count} steps · REST{w.id === 'order-pastry' ? ' + EVENT' : ''}
          </p>
          {#if w.id === 'restock-pastry'}<StatusBadge
              status="failed"
              label="Run #14 failed"
            />
            <p>
              <ButtonLink
                href="#/workflows/pastry/restock-pastry"
                variant="primary">Open workflow</ButtonLink
              >
            </p>{:else if w.id === 'check-menu'}<Button
              disabled={linked}
              onclick={() => {
                demo.workflowSourcesLinked = true;
                notice = 'beerCatalog linked to Beer Catalog 1.0 (simulated).';
              }}>Link beerCatalog</Button
            >{:else}<Callout title="Not executable in the POC"
              >AsyncAPI workflow steps are not supported yet.</Callout
            >{/if}</Panel
        >{/each}
    </div>
  {:else}
    <div class="demo-actions">
      <ApiBadge
        arazzo
        name="restock-pastry"
        version="1.1.0"
      />{#if running}<span>Target: {target} (simulated)</span><StatusBadge
          status={done < limit ? 'running' : failed ? 'failed' : 'conformant'}
        /><Button
          onclick={() => {
            done = 0;
            paused = false;
          }}>Replay run</Button
        ><Button disabled={done >= limit} onclick={() => (paused = !paused)}
          >{paused ? 'Resume' : 'Pause'}</Button
        >{:else}<Field label="Run target"
          >{#snippet children(p)}<Select {...p} bind:value={demo.workflowTarget}
              ><option value="mocks">Mocks</option><option
                value="implementations">Implementations</option
              ><option value="mixed">Mixed (proposed)</option></Select
            >{/snippet}</Field
        >{/if}
    </div>
    {#if running}<RunProgress
        {done}
        total={4}
        caption="steps checked"
        segments={steps.map((s, i) =>
          i >= done ? 'queued' : s.status === 'failed' ? 'failed' : 'done',
        )}
        now={done < limit
          ? steps[done].stepId
          : failed
            ? 'patchPastry failed · verifyPastry not run'
            : 'All steps passed'}
      />{#if done >= limit}<Callout
          title={failed ? 'Schema validation failed' : 'Workflow passed'}
          >{failed
            ? 'Success criteria passed, but price is the string "3.9". Two retries exhausted; verifyPastry was not run.'
            : 'The mock response matches the contract. All four steps passed.'}</Callout
        >{/if}{/if}
    <Tabs
      label="Workflow view"
      bind:value={tab}
      items={[
        { id: 'loom', label: 'Loom' },
        { id: 'steps', label: 'Steps', count: 4 },
        { id: 'contract', label: 'Arazzo source' },
      ]}
    >
      <TabPanel id="loom" value={tab}
        ><div class="demo-tab-content">
          <Panel title="The workflow Loom" flush
            ><WorkflowLoom
              {sources}
              {steps}
              {threads}
              selectedStep={selected}
              label="Restock pastry workflow"
              validatesSchemas
              onstepselect={(d) => {
                if (d.stepId) selected = d.stepId;
              }}
              inputs={[{ name: 'name', value: 'Millefeuille' }]}
              outputs={[{ name: 'price', value: running ? '"3.9"' : '3.9' }]}
            /></Panel
          >
        </div></TabPanel
      >
      <TabPanel id="steps" value={tab}
        ><div class="demo-tab-content">
          <DataTable
            caption="Workflow steps"
            rowKey="stepId"
            onrowselect={(r) => (selected = r.stepId)}
            selectedKey={selected}
            columns={[
              { key: 'stepId', header: 'Step', rowHeader: true },
              { key: 'source', header: 'Source' },
              { key: 'method', header: 'Method' },
              { key: 'path', header: 'Path' },
              { key: 'status', header: 'Result' },
            ]}
            rows={steps}
          />
        </div></TabPanel
      >
      <TabPanel id="contract" value={tab}
        ><div class="demo-tab-content">
          <CodeBlock
            caption="Arazzo contract"
            language="yaml"
            code={'arazzo: 1.1.0\ninfo:\n  title: Pastry workflows\n  version: "1.0"\nworkflows:\n  - workflowId: restock-pastry\n    steps:\n      - stepId: getPastry\n        operationId: getPastryByName\n      - stepId: patchPastry\n        operationId: patchPastry'}
          />
        </div></TabPanel
      >
    </Tabs>
    <Panel title={`Step inspector · ${selected}`}
      ><p class="demo-code">
        {steps.find((s) => s.stepId === selected)?.operation}
      </p>
      <CodeBlock
        caption="Success criterion"
        code={'$statusCode == 200'}
      />{#if selected === 'patchPastry'}<p>
          Retry after 1 second · retry limit 2 · schema validation on
        </p>{/if}<ButtonLink href="#/services/pastry2/operations/get-name"
        >Open operation behavior</ButtonLink
      ></Panel
    >
  {/if}
</div>
