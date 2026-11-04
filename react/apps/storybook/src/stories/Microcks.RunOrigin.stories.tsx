import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { RunOrigin } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/RunOrigin',
  component: RunOrigin,
  parameters: itemParams(['run-origin'], 'Where a run was started from: UI, API, Mock URL or a session.'),
} satisfies Meta<typeof RunOrigin>;

export const Default: StoryObj = {
  render: () => (
    <div className="inline">
      <RunOrigin origin="ui" />
      <RunOrigin origin="api" />
      <RunOrigin origin="mock-url" />
      <RunOrigin origin="session" sessionId="s-7f3a2c91" />
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof RunOrigin> = {
  args: { origin: 'ui', sessionId: undefined },
  argTypes: { origin: { control: 'select', options: ['ui', 'api', 'mock-url', 'session'] } },
};
