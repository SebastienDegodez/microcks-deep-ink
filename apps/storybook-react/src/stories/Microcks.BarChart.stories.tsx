import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { BarChart, type BarChartBar } from '@microcks-deep-ink/registry/react/bar-chart';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/BarChart',
  component: BarChart,
  parameters: itemParams(['bar-chart'], 'Selectable bar chart: one button per bar with a full label, one tab stop and arrow keys; axes and labels are hidden, and a visually hidden table is the text equivalent.'),
} satisfies Meta<typeof BarChart>;

const RUNS = Array.from({ length: 20 }, (_, i) => {
  const id = String(100 + i);
  const failed = i % 6 === 4;
  const ms = 700 + ((i * 337) % 1900);
  return { id, failed, ms };
});

export const ConformanceTimeline: StoryObj = {
  name: 'Runs (Tests)',
  render: () => {
    const [id, setId] = useState('119');
    const bars: BarChartBar[] = RUNS.map((r, i) => ({
      id: r.id,
      value: r.ms,
      tone: r.failed ? 'danger' : 'success',
      label: i === 0 || i === RUNS.length - 1 || Number(r.id) % 5 === 0 ? r.id : '',
      description: `Run #${r.id}, ${r.failed ? 'failed' : 'passed'}, ${r.ms} ms`,
    }));
    return (
      <div style={{ maxWidth: 900 }}>
        <BarChart
          label="Runs, oldest to newest. Use the arrow keys to move between bars."
          bars={bars}
          max={3000}
          selectedId={id}
          onSelect={setId}
          ticks={['3 s', '1.5 s', '0']}
          table={{ caption: 'Last 20 runs, oldest first', columns: ['Run', 'Result', 'Duration'], rows: RUNS.map((r) => [`#${r.id}`, r.failed ? 'Failed' : 'Passed', `${r.ms} ms`]) }}
        />
      </div>
    );
  },
};

const HOURS = [12, 8, 4, 3, 2, 5, 18, 40, 85, 72, 64, 66];

export const PerHour: StoryObj = {
  name: 'Per hour, future slots (Usage)',
  render: () => {
    const [id, setId] = useState('11');
    const bars: BarChartBar[] = Array.from({ length: 24 }, (_, h) => {
      const v = HOURS[h];
      const hh = String(h).padStart(2, '0');
      return v === undefined
        ? { id: String(h), value: 0, future: true, description: `${hh}:00, not yet`, label: h % 3 === 0 ? `${hh}h` : '' }
        : { id: String(h), value: v, description: `${hh}:00 to ${String(h + 1).padStart(2, '0')}:00, ${v} invocations`, label: h % 3 === 0 ? `${hh}h` : '' };
    });
    return (
      <div style={{ maxWidth: 900 }}>
        <BarChart
          label="Invocations per hour for API Pastry 2.0. Peak 85."
          bars={bars}
          max={90}
          selection="fill"
          height={200}
          gap={6}
          grid={[0, 0.5]}
          selectedId={id}
          onSelect={setId}
          ticks={['90', '45', '0']}
          table={{ caption: 'Invocations per hour, today', columns: ['Hour', 'Invocations'], rows: HOURS.map((v, h) => [`${String(h).padStart(2, '0')}:00`, String(v)]) }}
        />
      </div>
    );
  },
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof BarChart> = {
  args: {
    label: 'Runs, oldest to newest. Use the arrow keys to move between bars.',
    bars: RUNS.map((r, i): BarChartBar => ({
      id: r.id, value: r.ms, tone: r.failed ? 'danger' : 'success',
      label: i === 0 || i === RUNS.length - 1 || Number(r.id) % 5 === 0 ? r.id : '',
      description: `Run #${r.id}, ${r.failed ? 'failed' : 'passed'}, ${r.ms} ms`,
    })),
    max: 3000, selectedId: '119', selection: 'outline', ticks: ['3 s', '1.5 s', '0'], ticksEnd: undefined, grid: undefined, height: undefined, gap: undefined, minHeight: undefined,
    table: { caption: 'Last 20 runs, oldest first', columns: ['Run', 'Result', 'Duration'], rows: RUNS.map((r) => [`#${r.id}`, r.failed ? 'Failed' : 'Passed', `${r.ms} ms`]) },
  },
  argTypes: { selection: { control: 'inline-radio', options: ['outline', 'fill'] }, onSelect: { table: { disable: true } } },
  decorators: [(Story) => <div style={{ maxWidth: 900 }}><Story /></div>],
};
