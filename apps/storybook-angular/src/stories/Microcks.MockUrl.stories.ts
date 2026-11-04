import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MockUrlComponent } from '@microcks-deep-ink/registry/angular/mock-url';
import { MOCK_BASE } from '@microcks-deep-ink/storybook-shared/fixtures';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/MockUrl',
  argTypes: argTypesFor('mock-url', ['MockUrlComponent']),
  decorators: [moduleMetadata({ imports: [MockUrlComponent] })],
  parameters: itemParams(['mock-url', 'method-tag', 'copy-button', 'segmented'], "The contract made copyable: the URL in mono, a snippet format group (URL, curl, HTTPie, MCP tool) and a Copy button with a live announcement."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { base: MOCK_BASE },
    template: `
<div style="max-width:720px"><mk-mock-url [url]="base + '/pastries'" /></div>
    `,
  }),
};

export const AgentReady: StoryObj = {
  name: "Agent-ready (MCP tool)",
  render: () => ({
    props: { base: MOCK_BASE },
    template: `
<div style="max-width:720px"><mk-mock-url [url]="base + '/pastries/Millefeuille'" mcpTool="getPastry" /></div>
    `,
  }),
};

export const Bare: StoryObj = {
  render: () => ({
    props: { base: MOCK_BASE },
    template: `
<div style="max-width:720px"><mk-mock-url bare method="PATCH" [url]="base + '/pastries/Millefeuille'" /></div>
    `,
  }),
};
