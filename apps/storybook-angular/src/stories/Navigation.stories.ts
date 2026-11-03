import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { fn } from 'storybook/test';
import { DEEP_INK } from '@microcks-deep-ink/angular';
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

const meta: Meta = { title: 'Navigation', decorators: [moduleMetadata({ imports: [DEEP_INK] })] };
export default meta;

export const CommandBar: StoryObj = {
  render: () => ({
    props: { items: COMMANDS, chosen: fn() },
    template: `<mk-command-bar [inline]="true" [items]="items" query="test pastry" [globalShortcut]="false" (mkCommand)="chosen($event.detail)"></mk-command-bar>`,
  }),
  parameters: { docs: { description: { story: '⌘K palette. Actions come first when the query contains a verb.' } } },
};

export const WorkflowLoom: StoryObj = {
  name: 'Workflows / WorkflowLoom',
  render: () => ({
    props: { sources: LOOM_SOURCES, steps: LOOM_STEPS, threads: LOOM_THREADS, gotos: LOOM_GOTOS },
    template: `
      <div class="di-col">
        <mk-api-badge [arazzo]="true" name="Restock a pastry" version="1.2.0"></mk-api-badge>
        <mk-workflow-loom [sources]="sources" [steps]="steps" [threads]="threads" [gotos]="gotos"></mk-workflow-loom>
        <p class="di-note">Double proof: criteria (Arazzo successCriteria) and contract (OpenAPI conformance). Hover a step to follow its threads.</p>
      </div>`,
  }),
};

export const TopBar: StoryObj = {
  name: 'Shell / TopBar',
  parameters: { layout: 'fullscreen' },
  render: () => ({
    props: { open: fn(), primary: fn() },
    template: `<mk-top-bar userInitials="SD" (mkOpenCommand)="open()" (mkPrimaryAction)="primary()"></mk-top-bar>`,
  }),
};

export const SideNav: StoryObj = {
  name: 'Shell / SideNav',
  render: () => ({
    props: { nav: fn() },
    template: `<div style="width:240px;height:520px"><mk-side-nav active="services" (mkNavigate)="nav($event.detail)"></mk-side-nav></div>`,
  }),
};

export const ServicePage: StoryObj = {
  name: 'Shell / Service page',
  parameters: { layout: 'fullscreen' },
  render: () => ({
    props: { tabs: SERVICE_TABS, tab: 'operations', ops: OPERATIONS, base: MOCK_BASE, sel: '/pastries/{name}', conf: CONFORMANCE, items: COMMANDS, open: false },
    template: `
      <mk-app-shell>
        <mk-top-bar slot="top-bar" userInitials="SD" (mkOpenCommand)="open = true"></mk-top-bar>
        <mk-side-nav slot="nav" active="services"></mk-side-nav>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <h1 style="font:var(--type-display);margin:0">API Pastry</h1>
          <mk-api-badge protocol="REST" name="API Pastry" version="2.0"></mk-api-badge>
          <mk-api-badge label="conformance" value="92%" status="success"></mk-api-badge>
          <mk-api-badge label="mcp" value="agent-ready" status="info"></mk-api-badge>
          <span style="margin-left:auto"><mk-button variant="primary" icon="tests">Run test</mk-button></span>
        </div>
        <mk-tabs [tabs]="tabs" [value]="tab" (mkChange)="tab = $event.detail"></mk-tabs>
        <div style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:24px">
          <mk-panel [flush]="true" heading="Operations">
            @for (o of ops; track o.method + o.path) {
              <mk-operation-row [method]="o.method" [path]="o.path" [meta]="o.meta" [mockUrl]="base + o.path"
                [selected]="sel === o.path && o.method === 'GET'" (mkSelect)="sel = $event.detail.path"></mk-operation-row>
            }
          </mk-panel>
          <div class="di-col">
            <mk-panel heading="Mock URL"><mk-mock-url [url]="base + sel.replace('{name}', 'Millefeuille')" mcpTool="get_pastry_by_name"></mk-mock-url></mk-panel>
            <mk-panel heading="Conformance"><mk-conformance-band [outcomes]="conf"></mk-conformance-band></mk-panel>
          </div>
        </div>
        <mk-command-bar [items]="items" [open]="open" (mkClose)="open = false"></mk-command-bar>
      </mk-app-shell>`,
  }),
};
