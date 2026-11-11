<script lang="ts">
  import { untrack } from 'svelte';
  import {
    ApiBadge,
    Button,
    ButtonLink,
    Callout,
    CodeBlock,
    ConformanceMatrix,
    Field,
    Input,
    MockUrl,
    Panel,
    SkillList,
    Tabs,
    TabPanel,
    TaskTimeline,
    type MatrixGroup,
    type TaskTimelineNode,
  } from '@microcks/deep-ink';
  let { path }: { path: string } = $props();
  const testing = $derived(path.startsWith('/tests/agent/'));
  let tab = $state(untrack(() => path.split('/')[3] || 'skills'));
  let skill = $state('browse');
  let prompt = $state('Find a pastry for me');
  let reply = $state('');
  let node = $state<number | undefined>();
  let selectedCell = $state<string | undefined>();
  let nodes = $state<TaskTimelineNode[]>([
    { state: 'submitted', at: '+0 ms' },
    { state: 'working', at: '+300 ms' },
    { state: 'input-required', at: '+900 ms' },
    { state: 'working', at: 'turn 2', connector: 'reply "M"' },
    { state: 'completed', at: '+1.6 s' },
  ]);
  const skills = [
    {
      id: 'browse',
      name: 'Browse pastries',
      tags: ['catalogue', 'pastry'],
      calls: 64,
      meta: 'Find available pastries',
    },
    {
      id: 'recommend',
      name: 'Recommend a pastry',
      tags: ['recommendation'],
      calls: 42,
      meta: 'Choose by size and taste',
    },
    {
      id: 'order',
      name: 'Track an order',
      tags: ['order'],
      calls: 22,
      meta: 'Read the current order status',
    },
  ];
  const columns = [
    { id: 'jsonrpc', label: 'JSON-RPC 2.0' },
    { id: 'http', label: 'HTTP+JSON' },
    { id: 'grpc', label: 'gRPC' },
  ];
  const groups: MatrixGroup[] = [
    {
      id: 'card',
      label: 'Agent Card',
      rows: [
        {
          id: 'discovery',
          label: 'Discovery and skills',
          cells: columns.map((c) => ({ columnId: c.id, result: 'pass' })),
        },
      ],
    },
    {
      id: 'behavior',
      label: 'Behavior',
      rows: [
        {
          id: 'eclair-size-m',
          label: 'Eclair size M',
          sub: 'Input-required resumes the same task',
          cells: [
            { result: 'pass' },
            { result: 'fail', label: 'New task created instead of resuming' },
            { result: 'pass' },
          ],
        },
        {
          id: 'ord-2417-ready',
          label: 'Order ready',
          cells: [
            { result: 'pass' },
            { result: 'pass' },
            { result: 'fail', label: 'Illegal transition' },
          ],
        },
      ],
    },
  ];
  for (const group of groups)
    for (const row of group.rows)
      row.cells.forEach((cell, i) => {
        cell.columnId = columns[i].id;
      });
</script>

<div class="demo-page">
  <header class="demo-page-header">
    <div>
      <p><a href="#/services">APIs &amp; Services</a> / Pastry concierge</p>
      <h1 tabindex="-1">
        {testing ? 'Agent conformance · run #3' : 'Pastry concierge 1.0'}
      </h1>
      <p class="demo-muted">
        A2A 1.0 · 3 skills · JSON-RPC 2.0, HTTP+JSON and gRPC
      </p>
    </div>
    <ButtonLink href="#/tests/agent/3" variant="primary" icon="play"
      >Test agent</ButtonLink
    >
  </header>
  <div class="demo-actions">
    <ApiBadge protocol="A2A" name="Pastry concierge" version="1.0" />
  </div>
  {#if testing}
    <Callout title="Two behavior checks failed"
      >HTTP+JSON creates a new task instead of resuming eclair-size-m. gRPC
      reports an illegal transition for ord-2417-ready.</Callout
    >
    <ConformanceMatrix
      caption="Agent conformance by transport"
      {columns}
      {groups}
      selectedKey={selectedCell}
      onselectcell={(key) => (selectedCell = key)}
    />
    {#if selectedCell}<Panel title="Selected check"
        ><p class="demo-code">{selectedCell}</p>
        <CodeBlock
          caption="Expected task transition"
          code="TASK_STATE_INPUT_REQUIRED → TASK_STATE_WORKING → TASK_STATE_COMPLETED"
        /></Panel
      >{/if}
  {:else}
    <Tabs
      label="Agent sections"
      bind:value={tab}
      items={[
        { id: 'card', label: 'Agent Card' },
        { id: 'skills', label: 'Skills', count: 3 },
        { id: 'tasks', label: 'Tasks', live: true },
        { id: 'mock', label: 'Mock conversation' },
      ]}
    >
      <TabPanel id="card" value={tab}
        ><div class="demo-tab-content">
          <CodeBlock
            caption="Agent Card"
            language="json"
            code={JSON.stringify(
              {
                name: 'Pastry concierge',
                version: '1.0',
                protocolVersion: '1.0',
                description: 'Helps customers choose pastries',
                supportedInterfaces: columns.map((c) => ({
                  protocolBinding: c.label,
                  url: `http://microcks.local:8080/a2a/concierge/${c.id}`,
                })),
                skills,
              },
              null,
              2,
            )}
          />
        </div></TabPanel
      >
      <TabPanel id="skills" value={tab}
        ><div class="demo-tab-content demo-two">
          <Panel title="Skills"
            ><SkillList
              label="Agent skills"
              {skills}
              selectedId={skill}
              onselectskill={(id) => (skill = id)}
            /></Panel
          ><Panel title={skills.find((s) => s.id === skill)?.name}
            ><p>{skills.find((s) => s.id === skill)?.meta}</p>
            <p>Input modes: text · Output modes: text, JSON</p>
            <Button onclick={() => (tab = 'mock')}>Try a conversation</Button
            ><MockUrl
              url="http://microcks.local:8080/a2a/concierge"
              method="POST"
            /></Panel
          >
        </div></TabPanel
      >
      <TabPanel id="tasks" value={tab}
        ><div class="demo-tab-content">
          <Panel title="task-9a04 · Recommendation"
            ><TaskTimeline
              label="Agent task lifecycle"
              {nodes}
              selectedIndex={node}
              onselectnode={(i) => (node = i)}
              showUnreached
            />
            <p>
              {node === undefined
                ? 'Select a state to inspect its wire payload.'
                : `State: ${nodes[node].state} · ${nodes[node].at}`}
            </p>
            <Button
              onclick={() => {
                node = undefined;
                nodes = [
                  { state: 'submitted', at: '+0 ms' },
                  { state: 'working', at: '+300 ms' },
                  { state: 'input-required', at: '+900 ms' },
                ];
              }}>Start scripted task</Button
            >
            <Button
              disabled={[
                'completed',
                'failed',
                'rejected',
                'canceled',
              ].includes(nodes[nodes.length - 1]?.state)}
              onclick={() => {
                node = undefined;
                nodes = [
                  { state: 'submitted', at: '+0 ms' },
                  { state: 'working', at: '+300 ms' },
                  { state: 'canceled', at: 'now' },
                ];
              }}>Cancel task</Button
            ></Panel
          >
        </div></TabPanel
      >
      <TabPanel id="mock" value={tab}
        ><div class="demo-tab-content">
          <Panel title="Scripted conversation"
            ><div class="demo-form">
              <Field label="Your message"
                >{#snippet children(p)}<Input
                    {...p}
                    bind:value={prompt}
                  />{/snippet}</Field
              ><Button
                variant="primary"
                onclick={() =>
                  (reply =
                    prompt.trim().toLowerCase() === 'm'
                      ? 'Millefeuille, size M, €3.90. Task completed.'
                      : 'What size would you like? Reply M to continue.')}
                >Send message</Button
              >{#if reply}<Callout title="Simulated agent reply"
                  >{reply}</Callout
                >{/if}
            </div></Panel
          >
        </div></TabPanel
      >
    </Tabs>
  {/if}
</div>
