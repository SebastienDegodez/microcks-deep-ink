import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { fn } from 'storybook/test';
import {
  MkApiBadge,
  MkAppShell,
  MkButton,
  MkCommandBar,
  MkConformanceBand,
  MkMockUrl,
  MkOperationRow,
  MkPanel,
  MkSideNav,
  MkTabs,
  MkTopBar,
  MkWorkflowLoom,
} from '@microcks-deep-ink/react';
import {
  COMMANDS,
  CONFORMANCE,
  LOOM_GOTOS,
  LOOM_SOURCES,
  LOOM_STEPS,
  LOOM_THREADS,
  MOCK_BASE,
  OPERATIONS,
  SERVICE_TABS,
} from '@microcks-deep-ink/storybook-shared/fixtures';

const meta: Meta = { title: 'Navigation' };
export default meta;

export const CommandBar: StoryObj<typeof MkCommandBar> = {
  render: (args) => <MkCommandBar {...args} />,
  args: { inline: true, items: COMMANDS, query: 'test pastry', globalShortcut: false, onMkCommand: fn() },
  parameters: { docs: { description: { story: '⌘K palette. Actions come first when the query contains a verb. In apps, drop `inline` and press ⌘K.' } } },
};

export const WorkflowLoom: StoryObj<typeof MkWorkflowLoom> = {
  name: 'Workflows / WorkflowLoom',
  render: () => (
    <div className="di-col">
      <MkApiBadge arazzo name="Restock a pastry" version="1.2.0" />
      <MkWorkflowLoom sources={LOOM_SOURCES} steps={LOOM_STEPS} threads={LOOM_THREADS} gotos={LOOM_GOTOS} />
      <p className="di-note">Double proof: criteria (Arazzo successCriteria) and contract (OpenAPI conformance). A 200 that violates the schema is still a failure. Hover a step to follow its threads.</p>
    </div>
  ),
};

export const TopBar: StoryObj<typeof MkTopBar> = {
  name: 'Shell / TopBar',
  parameters: { layout: 'fullscreen' },
  render: (args) => <MkTopBar {...args} />,
  args: { userInitials: 'SD', onMkOpenCommand: fn(), onMkPrimaryAction: fn() },
};

export const SideNav: StoryObj<typeof MkSideNav> = {
  name: 'Shell / SideNav',
  render: (args) => (
    <div style={{ width: 240, height: 520 }}>
      <MkSideNav {...args} />
    </div>
  ),
  args: { active: 'services', onMkNavigate: fn() },
};

export const ServicePage: StoryObj = {
  name: 'Shell / Service page',
  parameters: { layout: 'fullscreen' },
  render: () => {
    const [tab, setTab] = useState('operations');
    const [sel, setSel] = useState('/pastries/{name}');
    const [open, setOpen] = useState(false);
    return (
      <MkAppShell>
        <MkTopBar slot="top-bar" userInitials="SD" onMkOpenCommand={() => setOpen(true)} />
        <MkSideNav slot="nav" active="services" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ font: 'var(--type-display)', margin: 0 }}>API Pastry</h1>
          <MkApiBadge protocol="REST" name="API Pastry" version="2.0" />
          <MkApiBadge label="conformance" value="92%" status="success" />
          <MkApiBadge label="mcp" value="agent-ready" status="info" />
          <span style={{ marginLeft: 'auto' }}>
            <MkButton variant="primary" icon="tests">Run test</MkButton>
          </span>
        </div>
        <MkTabs tabs={SERVICE_TABS} value={tab} onMkChange={(e) => setTab(e.detail)} />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 24 }}>
          <MkPanel flush heading="Operations">
            {OPERATIONS.map((o) => (
              <MkOperationRow key={o.method + o.path} method={o.method} path={o.path} meta={o.meta} selected={sel === o.path && o.method === 'GET'} mockUrl={`${MOCK_BASE}${o.path}`} onMkSelect={(e) => setSel(e.detail.path)} />
            ))}
          </MkPanel>
          <div className="di-col">
            <MkPanel heading="Mock URL">
              <MkMockUrl url={`${MOCK_BASE}${sel.replace('{name}', 'Millefeuille')}`} mcpTool="get_pastry_by_name" />
            </MkPanel>
            <MkPanel heading="Conformance">
              <MkConformanceBand outcomes={CONFORMANCE} />
            </MkPanel>
          </div>
        </div>
        <MkCommandBar items={COMMANDS} open={open} onMkClose={() => setOpen(false)} />
      </MkAppShell>
    );
  },
};
