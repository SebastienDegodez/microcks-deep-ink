import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { LiveIndicator } from '@microcks-deep-ink/registry/react/live-indicator';
import { RunnerLog } from '@microcks-deep-ink/registry/react/runner-log';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/RunnerLog',
  component: RunnerLog,
  parameters: itemParams(['runner-log', 'live-indicator'], 'The runner log: a role="log" list of time, level and message. Levels are always written; the colour only speeds up scanning.'),
} satisfies Meta<typeof RunnerLog>;

const LINES = [
  { time: '09:10:04', level: 'INFO' as const, text: 'Run #119 · API Pastry 2.0 · 3 operations' },
  { time: '09:10:04', level: 'SEND' as const, text: 'GET /pastries?size=M' },
  { time: '09:10:04', level: 'PASS' as const, text: '200 OK · schema valid · 41 ms' },
  { time: '09:10:05', level: 'SEND' as const, text: 'PATCH /pastries/Eclair%20Cafe' },
  { time: '09:10:05', level: 'FAIL' as const, text: 'price: expected number, got string', error: true },
  { time: '09:10:05', level: 'WAIT' as const, text: 'next step in 300 ms' },
];

export const Streaming: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <RunnerLog status={<LiveIndicator variant="inline" label="live · streaming" />} lines={LINES} />
    </div>
  ),
};

export const Completed: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <RunnerLog status="6 lines · completed" lines={LINES} />
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof RunnerLog> = {
  args: {
    title: 'Runner log', status: <LiveIndicator />,
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
