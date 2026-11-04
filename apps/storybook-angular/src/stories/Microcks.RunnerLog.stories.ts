import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { LiveIndicatorComponent } from '@microcks-deep-ink/registry/angular/live-indicator';
import { RunnerLogComponent } from '@microcks-deep-ink/registry/angular/runner-log';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/RunnerLog',
  argTypes: argTypesFor('runner-log', ['RunnerLogComponent']),
  decorators: [moduleMetadata({ imports: [RunnerLogComponent, LiveIndicatorComponent] })],
  parameters: itemParams(['runner-log', 'live-indicator'], "The runner log: a role=\"log\" list of time, level and message. Levels are always written; the colour only speeds up scanning."),
};
export default meta;

const LINES = [
  { time: '09:10:04', level: 'INFO', text: 'Run #119 · API Pastry 2.0 · 3 operations' },
  { time: '09:10:04', level: 'SEND', text: 'GET /pastries?size=M' },
  { time: '09:10:04', level: 'PASS', text: '200 OK · schema valid · 41 ms' },
  { time: '09:10:05', level: 'SEND', text: 'PATCH /pastries/Eclair%20Cafe' },
  { time: '09:10:05', level: 'FAIL', text: 'price: expected number, got string', error: true },
  { time: '09:10:05', level: 'WAIT', text: 'next step in 300 ms' },
];

export const Streaming: StoryObj = {
  render: () => ({
    props: { lines: LINES },
    template: `<div style="max-width: 560px"><section mkRunnerLog [lines]="lines"><span mkRunnerLogStatus><span mkLiveIndicator variant="inline" label="live · streaming"></span></span></section></div>`,
  }),
};

export const Completed: StoryObj = {
  render: () => ({
    props: { lines: LINES },
    template: `<div style="max-width: 560px"><section mkRunnerLog [lines]="lines"><span mkRunnerLogStatus>6 lines · completed</span></section></div>`,
  }),
};
