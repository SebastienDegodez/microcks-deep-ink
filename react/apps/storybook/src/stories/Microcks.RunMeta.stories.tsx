import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { RunMeta } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/RunMeta',
  component: RunMeta,
  parameters: itemParams(['run-meta'], 'The meta line under a run header (TestRun, AgentTestRun, WorkflowRun): muted keys and their values in a native `<dl>`, wrapping on narrow screens.'),
} satisfies Meta<typeof RunMeta>;

export const Default: StoryObj = {
  render: () => (
    <RunMeta
      items={[
        { term: 'Endpoint', value: 'https://concierge.acme.io/a2a', kind: 'url' },
        { term: 'Runner', value: 'A2A_CONFORMANCE', kind: 'chip' },
        { term: 'Started', value: 'just now', detail: 'Nov 3, 2026 14:12:08' },
        { term: 'Duration', value: '4.2 s', kind: 'mono' },
        { term: 'Launched by', value: 'MA' },
      ]}
    />
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof RunMeta> = {
  args: {
    items: [
      { term: 'Started', value: '2026-11-03 09:10' },
      { term: 'Endpoint', value: 'http://pastry:8080/rest/API+Pastry/2.0.0', kind: 'url' },
      { term: 'Runner', value: 'OPEN_API_SCHEMA', kind: 'mono' },
      { term: 'Origin', value: 'CI', kind: 'chip', detail: 'GitHub Actions' },
    ],
  },
};
