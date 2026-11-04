import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { RunMeta } from '@microcks-deep-ink/registry/react/run-meta';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/RunMeta',
  parameters: itemParams(['run-meta'], 'The meta line under a run header (TestRun, AgentTestRun, WorkflowRun): muted keys and their values in a native `<dl>`, wrapping on narrow screens.'),
} satisfies Meta;

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
