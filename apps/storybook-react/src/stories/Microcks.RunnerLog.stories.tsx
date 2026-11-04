import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { LiveIndicator } from '@microcks-deep-ink/registry/react/live-indicator';
import { RunnerLog } from '@microcks-deep-ink/registry/react/runner-log';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/RunnerLog',
  parameters: itemParams(['runner-log', 'live-indicator'], 'The runner log: a role="log" list of time, level and message. Levels are always written; the colour only speeds up scanning.'),
} satisfies Meta;

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

/** The `WARN` level: a warning that does not fail the step. */
export const WithWarning: StoryObj = {
  name: 'With a warning',
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <RunnerLog
        title="Run #118"
        status="5 lines · completed with a warning"
        lines={[
          { time: '09:08:11', level: 'INFO', text: 'Run #118 · API Pastry 2.0 · 3 operations' },
          { time: '09:08:11', level: 'SEND', text: 'GET /pastries/Millefeuille' },
          { time: '09:08:12', level: 'WARN', text: 'Response has an undeclared field "calories"', emphasis: true },
          { time: '09:08:12', level: 'PASS', text: '200 OK · schema valid · 55 ms' },
          { time: '09:08:12', level: 'INFO', text: 'Completed with 1 warning' },
        ]}
      />
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
