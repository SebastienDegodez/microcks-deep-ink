import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Button } from '@microcks/deep-ink';
import { EmptyState } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Components/EmptyState',
  component: EmptyState,
  parameters: itemParams(['empty-state', 'button'], 'Says what is missing and offers the next step. The title is a heading: choose its level with `headingLevel`.'),
} satisfies Meta<typeof EmptyState>;

export const Default: StoryObj = {
  render: () => (
    <EmptyState title="No services yet" actions={<Button variant="primary" icon="upload">Import a contract</Button>}>
      Import an OpenAPI, AsyncAPI, gRPC or GraphQL contract to create your first mock.
    </EmptyState>
  ),
};

/** `align="start"` for an empty panel inside a page; `headingLevel` follows the page outline. */
export const AlignStart: StoryObj = {
  name: 'Aligned to the start',
  render: () => (
    <EmptyState title="No runs yet" align="start" headingLevel={3} actions={<Button variant="primary" icon="tests">Run a test</Button>}>
      Runs appear here after the first test.
    </EmptyState>
  ),
};

export const NoResults: StoryObj = {
  name: 'No results (icon)',
  render: () => (
    <EmptyState title="No service matches" icon="search-x" actions={<Button variant="primary" icon="reset">Reset filters</Button>}>
      <p>None of the 11 services matches: “zzz”. Remove a filter or reset the selection.</p>
    </EmptyState>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof EmptyState> = {
  args: { title: 'No services yet', headingLevel: 2, icon: 'search-x', align: 'center', children: 'Import a contract to create your first service.' },
  argTypes: {
    align: { control: 'inline-radio', options: ['center', 'start'] },
    headingLevel: { control: 'inline-radio', options: [1, 2, 3, 4, 5, 6] },
  },
};
