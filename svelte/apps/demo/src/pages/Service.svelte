<script lang="ts">
  import { untrack } from 'svelte';
  import {
    AiGhostRow,
    ApiBadge,
    Button,
    ButtonLink,
    Callout,
    Chip,
    CodeBlock,
    DataTable,
    Field,
    Input,
    LiveIndicator,
    MockUrl,
    OperationList,
    OperationRow,
    Panel,
    Select,
    Tabs,
    TabPanel,
    Textarea,
    type TabItem,
  } from '@microcks/deep-ink';
  import { operations, mockBase, pastryJson } from '../data';
  import { demo } from '../model.svelte';
  let { path }: { path: string } = $props();
  const serviceId = $derived(path.split('/')[2]);
  const svc = $derived(demo.services.find((s) => s.id === serviceId));
  const behavior = $derived(path.includes('/operations/'));
  const copilot = $derived(path.endsWith('/copilot'));
  let tab = $state('operations');
  let selected = $state(
    untrack(() =>
      path.includes('/operations/') ? path.split('/')[4] : 'get-name',
    ),
  );
  let example = $state('millefeuille');
  let dispatcher = $state(
    untrack(() => demo.behaviors[path]?.dispatcher ?? 'URI_PARTS'),
  );
  let delay = $state(untrack(() => demo.behaviors[path]?.delay ?? '0'));
  let rule = $state(
    untrack(() => demo.behaviors[path]?.rule ?? 'name → example.name'),
  );
  let description = $state(
    untrack(
      () => demo.descriptions[serviceId] ?? 'Pastry catalogue — demo contract',
    ),
  );
  let requestName = $state('Millefeuille');
  let simulated = $state(false);
  let notice = $state('');
  let proposals = $state([
    { name: 'Paris-Brest', price: 4.5, size: 'M' },
    { name: 'Religieuse', price: 3.5, size: 'L' },
  ]);
  let editing = $state('');
  let editedJson = $state('');
  const op = $derived(
    operations.find((o) => o.id === selected) ?? operations[1],
  );
  const current = $derived(
    demo.examples.find((e) => e.id === example) ?? demo.examples[0],
  );
  const tabs: TabItem[] = [
    { id: 'operations', label: 'Operations', count: 4 },
    { id: 'properties', label: 'Properties' },
    { id: 'tests', label: 'Tests', count: 27 },
    { id: 'contracts', label: 'Contracts' },
    { id: 'agent', label: 'Agent-ready' },
  ];
  function accept(name: string, price: number, size: string) {
    if (!name.trim() || !Number.isFinite(price) || price < 0 || !size.trim()) {
      notice = 'Provide a name, a non-negative price and a size.';
      return;
    }
    const id = name.toLowerCase();
    const existing = demo.examples.find((e) => e.id === id);
    if (existing) Object.assign(existing, { name, price, size });
    else demo.examples.push({ id, name, price, size });
    proposals = proposals.filter((p) => p.name !== name);
    notice = `Accepted ${name}. Available in the mock examples for this session.`;
  }
  function applyEdit() {
    try {
      const value: unknown = JSON.parse(editedJson);
      if (
        !value ||
        typeof value !== 'object' ||
        !('name' in value) ||
        typeof value.name !== 'string' ||
        !('price' in value) ||
        typeof value.price !== 'number' ||
        !('size' in value) ||
        typeof value.size !== 'string'
      ) {
        notice = 'Example must contain a name, a numeric price and a size.';
        return;
      }
      accept(value.name, value.price, value.size);
      proposals = proposals.filter((p) => p.name !== editing);
      editing = '';
    } catch (error) {
      notice = `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
  function saveBehavior() {
    if (!Number.isFinite(Number(delay)) || Number(delay) < 0) {
      notice = 'Delay must be a non-negative number.';
      return;
    }
    demo.behaviors[path] = { dispatcher, delay, rule };
    notice = `Dispatcher ${dispatcher} saved in memory with ${delay} ms delay.`;
  }
</script>

<div class="demo-page">
  {#if !svc}<h1 tabindex="-1">Service not found</h1>
    <Callout title="Unknown service"
      >This service does not exist in the demo catalogue.</Callout
    ><ButtonLink href="#/services">Back to catalogue</ButtonLink>
  {:else}
    <header class="demo-page-header">
      <div>
        <p>
          <a href="#/services">APIs &amp; Services</a> /
          <a href={`#/services/${svc.id}`}>{svc.name} {svc.version}</a>
        </p>
        <h1 tabindex="-1">
          {behavior
            ? `${op.method} ${op.path}`
            : copilot
              ? 'AI Copilot'
              : `${svc.name} ${svc.version}`}
        </h1>
        <p class="demo-actions">
          <ApiBadge protocol={svc.protocol} name={svc.format} /><LiveIndicator
            label="mock live"
          /><Chip labelKey="domain">{svc.domain}</Chip>
        </p>
        <p class="demo-muted">
          The pastry catalogue contract, served as a mock and verified against
          implementations.
        </p>
      </div>
      <div class="demo-actions">
        <ButtonLink
          href={`#/tests/create?service=${svc.id}`}
          variant="primary"
          icon="play">Run a test</ButtonLink
        ><ButtonLink href={`#/services/${svc.id}/copilot`} icon="spark"
          >AI Copilot</ButtonLink
        >
      </div>
    </header>
    {#if notice}<p role="status">{notice}</p>{/if}
    {#if behavior}
      <div class="demo-two">
        <Panel title="Dispatcher configuration"
          ><div class="demo-form">
            <Field label="Dispatcher"
              >{#snippet children(p)}<Select {...p} bind:value={dispatcher}
                  ><option>URI_PARTS</option><option>JSON_BODY</option><option
                    >SEQUENCE</option
                  ><option>DEFAULT</option></Select
                >{/snippet}</Field
            ><Field label="Response delay (ms)"
              >{#snippet children(p)}<Input
                  {...p}
                  type="number"
                  min="0"
                  bind:value={delay}
                />{/snippet}</Field
            ><Field
              label="Dispatcher rule"
              help="Matches the request name to an example."
              >{#snippet children(p)}<Textarea
                  {...p}
                  bind:value={rule}
                />{/snippet}</Field
            ><Button variant="primary" onclick={saveBehavior}
              >Save behavior</Button
            >
          </div></Panel
        ><Panel title="Request simulator"
          ><div class="demo-form">
            <Field label="Pastry name"
              >{#snippet children(p)}<Input
                  {...p}
                  bind:value={requestName}
                />{/snippet}</Field
            ><Button
              variant="primary"
              icon="play"
              onclick={() => (simulated = true)}>Simulate request</Button
            >{#if simulated}{@const found = demo.examples.find(
                (e) => e.name.toLowerCase() === requestName.toLowerCase(),
              )}<Callout
                title={found
                  ? '200 · Example matched'
                  : '404 · No example matches'}
                >{found
                  ? `${found.name} · ${dispatcher} · ${delay} ms delay`
                  : 'Choose Millefeuille, Eclair or Baba.'}</Callout
              >{#if found}<CodeBlock
                  caption="Simulated response"
                  code={JSON.stringify(found, null, 2)}
                />{/if}{/if}
          </div></Panel
        >
      </div>
    {:else if copilot}
      <Callout title="Demo proposals, not a connected AI"
        >Review generated examples before accepting. Changes live only in this
        browser session.</Callout
      >
      <Panel title="Generate examples"
        ><div class="demo-form">
          <Field label="Instructions"
            >{#snippet children(p)}<Textarea
                {...p}
                placeholder="Generate French pastries with different sizes and prices"
              />{/snippet}</Field
          ><Button
            icon="spark"
            variant="primary"
            onclick={() => {
              proposals = [
                { name: 'Paris-Brest', price: 4.5, size: 'M' },
                { name: 'Religieuse', price: 3.5, size: 'L' },
              ];
              notice = 'Two simulated proposals are ready for review.';
            }}>Generate examples</Button
          >
        </div></Panel
      >
      {#each proposals as p}<AiGhostRow
          name={p.name}
          onaccept={() => accept(p.name, p.price, p.size)}
          onreject={() => {
            proposals = proposals.filter((x) => x.name !== p.name);
            notice = `Rejected ${p.name}.`;
          }}
          onedit={() => {
            editing = p.name;
            editedJson = JSON.stringify(p, null, 2);
          }}
          ><CodeBlock
            variant="bare"
            code={JSON.stringify(p, null, 2)}
          /></AiGhostRow
        >{/each}
      {#if editing}<Panel title={`Edit ${editing}`}
          ><Field label="Example JSON"
            >{#snippet children(p)}<Textarea
                {...p}
                bind:value={editedJson}
                rows={7}
              />{/snippet}</Field
          ><Button variant="primary" onclick={applyEdit}
            >Accept edited example</Button
          ></Panel
        >{/if}
    {:else}
      <Tabs label="Service sections" items={tabs} bind:value={tab}>
        <TabPanel id="operations" value={tab}
          ><div class="demo-tab-content demo-service-split">
            <Panel title="Operations" flush
              ><OperationList label="Service operations"
                >{#each operations as o}<OperationRow
                    method={o.method}
                    path={o.path}
                    meta={`${o.examples} examples · ${o.dispatcher} · ${o.calls} calls / 24 h`}
                    selected={selected === o.id}
                    onselect={() => (selected = o.id)}
                  />{/each}</OperationList
              ></Panel
            >
            <div class="demo-stack">
              <Panel title={`${op.method} ${op.path}`}
                ><div class="demo-actions">
                  <ButtonLink
                    href={`#/services/${svc.id}/operations/${op.id}`}
                    size="sm">Configure behavior</ButtonLink
                  ><ButtonLink
                    href={`#/services/${svc.id}/copilot`}
                    size="sm"
                    icon="spark">Generate examples</ButtonLink
                  >
                </div>
                <p class="demo-muted">
                  Mock URL · examples are selected by request parameters.
                </p>
                <MockUrl
                  url={`${mockBase}/pastries/${current?.name ?? 'Millefeuille'}`}
                  method={op.method}
                /></Panel
              ><Panel title="Examples"
                ><div class="demo-actions">
                  {#each demo.examples as e}<Chip
                      pressed={example === e.id}
                      onclick={() => (example = e.id)}>{e.name}</Chip
                    >{/each}
                </div>
                <CodeBlock
                  caption="Response · 200 application/json"
                  language="json"
                  code={current
                    ? JSON.stringify(
                        {
                          name: current.name,
                          price: current.price,
                          size: current.size,
                        },
                        null,
                        2,
                      )
                    : pastryJson}
                /></Panel
              >
            </div>
          </div></TabPanel
        >
        <TabPanel id="properties" value={tab}
          ><div class="demo-tab-content">
            <Panel title="Service properties"
              ><Field label="Description"
                >{#snippet children(p)}<Textarea
                    {...p}
                    bind:value={description}
                  />{/snippet}</Field
              ><Button
                onclick={() => {
                  demo.descriptions[serviceId] = description;
                  notice = 'Properties saved in memory.';
                }}>Save properties</Button
              ></Panel
            >
          </div></TabPanel
        >
        <TabPanel id="tests" value={tab}
          ><div class="demo-tab-content">
            <DataTable
              caption="Service test history"
              rowKey="id"
              rowHref={(r) => `#/tests/runner/${r.id}`}
              columns={[
                { key: 'id', header: 'Run' },
                { key: 'runner', header: 'Runner' },
                { key: 'result', header: 'Result' },
                { key: 'at', header: 'When' },
              ]}
              rows={demo.tests.filter((t) => t.serviceId === svc.id)}
            />
          </div></TabPanel
        >
        <TabPanel id="contracts" value={tab}
          ><div class="demo-tab-content">
            <CodeBlock
              caption="OpenAPI contract"
              language="yaml"
              code={'openapi: 3.0.3\ninfo:\n  title: API Pastry\n  version: "2.0"\npaths:\n  /pastries:\n    get:\n      operationId: getPastries\n      responses:\n        "200":\n          description: Pastry catalogue'}
            />
          </div></TabPanel
        >
        <TabPanel id="agent" value={tab}
          ><div class="demo-tab-content">
            <Panel title="Agent-ready · MCP"
              ><p>
                Operations exposed as tools, with examples derived from the
                contract.
              </p>
              <MockUrl
                url={`${mockBase}/pastries/Millefeuille`}
                mcpTool="getPastryByName"
              /><CodeBlock
                caption="Tool input schema"
                code={'{"name":"getPastryByName","inputSchema":{"type":"object","properties":{"name":{"type":"string"}}}}'}
              /></Panel
            >
          </div></TabPanel
        >
      </Tabs>
    {/if}
  {/if}
</div>
