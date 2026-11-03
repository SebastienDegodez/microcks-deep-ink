import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { MockUrl } from '@microcks-deep-ink/registry/react/mock-url';
import { MOCK_BASE } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/MockUrl',
  parameters: itemParams(['mock-url', 'method-tag', 'copy-button', 'segmented'], 'The contract made copyable: the URL in mono, a snippet format group (URL, curl, HTTPie, MCP tool) and a Copy button with a live announcement.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => <div style={{ maxWidth: 720 }}><MockUrl url={`${MOCK_BASE}/pastries`} /></div>,
};

export const AgentReady: StoryObj = {
  name: 'Agent-ready (MCP tool)',
  render: () => <div style={{ maxWidth: 720 }}><MockUrl url={`${MOCK_BASE}/pastries/Millefeuille`} mcpTool="getPastry" /></div>,
};

export const Bare: StoryObj = {
  render: () => <div style={{ maxWidth: 720 }}><MockUrl bare method="PATCH" url={`${MOCK_BASE}/pastries/Millefeuille`} /></div>,
};
