import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { BarChartComponent } from '@microcks-deep-ink/registry/angular/bar-chart';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/BarChart',
  decorators: [moduleMetadata({ imports: [BarChartComponent] })],
  parameters: itemParams(['bar-chart'], 'Selectable bar chart: one button per bar with a full label, one tab stop and arrow keys; axes and labels are hidden, and a visually hidden table is the text equivalent.'),
};
export default meta;

const RUNS = Array.from({ length: 20 }, (_, i) => {
  const id = String(100 + i);
  const failed = i % 6 === 4;
  const ms = 700 + ((i * 337) % 1900);
  return { id, failed, ms };
});

export const ConformanceTimeline: StoryObj = {
  name: 'Runs (Tests)',
  render: () => ({
    props: {
      selected: '119',
      bars: RUNS.map((r, i) => ({
        id: r.id,
        value: r.ms,
        tone: r.failed ? 'danger' : 'success',
        label: i === 0 || i === RUNS.length - 1 || Number(r.id) % 5 === 0 ? r.id : '',
        description: `Run #${r.id}, ${r.failed ? 'failed' : 'passed'}, ${r.ms} ms`,
      })),
      table: { caption: 'Last 20 runs, oldest first', columns: ['Run', 'Result', 'Duration'], rows: RUNS.map((r) => [`#${r.id}`, r.failed ? 'Failed' : 'Passed', `${r.ms} ms`]) },
      ticks: ['3 s', '1.5 s', '0'],
    },
    template: `<div style="max-width: 900px"><mk-bar-chart label="Runs, oldest to newest. Use the arrow keys to move between bars." [bars]="bars" [max]="3000" [selectedId]="selected" (select)="selected = $event" [ticks]="ticks" [table]="table" /></div>`,
  }),
};

const HOURS = [12, 8, 4, 3, 2, 5, 18, 40, 85, 72, 64, 66];

export const PerHour: StoryObj = {
  name: 'Per hour, future slots (Usage)',
  render: () => ({
    props: {
      selected: '11',
      bars: Array.from({ length: 24 }, (_, h) => {
        const v = HOURS[h];
        const hh = String(h).padStart(2, '0');
        return v === undefined
          ? { id: String(h), value: 0, future: true, description: `${hh}:00, not yet`, label: h % 3 === 0 ? `${hh}h` : '' }
          : { id: String(h), value: v, description: `${hh}:00, ${v} invocations`, label: h % 3 === 0 ? `${hh}h` : '' };
      }),
      table: { caption: 'Invocations per hour, today', columns: ['Hour', 'Invocations'], rows: HOURS.map((v, h) => [`${String(h).padStart(2, '0')}:00`, String(v)]) },
      ticks: ['90', '45', '0'],
    },
    template: `<div style="max-width: 900px"><mk-bar-chart label="Invocations per hour for API Pastry 2.0. Peak 85." [bars]="bars" [max]="90" selection="fill" [height]="200" [gap]="6" [selectedId]="selected" (select)="selected = $event" [ticks]="ticks" [table]="table" /></div>`,
  }),
};
