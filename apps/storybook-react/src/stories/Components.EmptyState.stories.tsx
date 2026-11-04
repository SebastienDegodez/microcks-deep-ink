import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Button } from '@microcks-deep-ink/registry/react/button';
import { EmptyState } from '@microcks-deep-ink/registry/react/empty-state';
import { itemParams } from './_meta';

export default {
  title: 'Components/EmptyState',
  parameters: itemParams(['empty-state', 'button'], 'Says what is missing and offers the next step. The title is a heading: choose its level with `headingLevel`.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <EmptyState title="No services yet" actions={<Button variant="primary" icon="upload">Import a contract</Button>}>
      Import an OpenAPI, AsyncAPI, gRPC or GraphQL contract to create your first mock.
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
