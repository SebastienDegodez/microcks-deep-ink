import { status } from './Microcks.RunnerLog/Playground.svelte';
import CompletedExample from './Microcks.RunnerLog/Completed.svelte';
import WithWarningExample from './Microcks.RunnerLog/WithWarning.svelte';
import StreamingExample from './Microcks.RunnerLog/Streaming.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';


import { RunnerLog } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/RunnerLog',
  component: RunnerLog,
  parameters: itemParams(['runner-log', 'live-indicator'], 'The runner log: a role="log" list of time, level and message. Levels are always written; the colour only speeds up scanning.'),
} satisfies Meta<typeof RunnerLog>;


export const Streaming: StoryObj = {
  render: () => ({ Component: StreamingExample }),
};

/** The `WARN` level: a warning that does not fail the step. */
export const WithWarning: StoryObj = {
  name: 'With a warning',
  render: () => ({ Component: WithWarningExample }),
};

export const Completed: StoryObj = {
  render: () => ({ Component: CompletedExample }),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof RunnerLog> = {
  args: {
    title: 'Runner log', status,
    lines: [
      { time: '09:10:01', level: 'INFO', text: 'Test started' },
      { time: '09:10:02', level: 'SEND', text: 'GET /pastries' },
      { time: '09:10:02', level: 'PASS', text: '200 OK, schema valid' },
      { time: '09:10:03', level: 'WARN', text: 'Response slower than 500 ms' },
      { time: '09:10:04', level: 'FAIL', text: 'PATCH /pastries/{name}: price must be a number', error: true },
      { time: '09:10:04', level: 'WAIT', text: 'Retrying in 2 s', emphasis: true },
    ],
  },
};
