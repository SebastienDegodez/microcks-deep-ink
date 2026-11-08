import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { BarChart } from '@microcks/deep-ink';
import { itemParams } from './_meta';
import type { BarChartBar } from '@microcks/deep-ink';
import ConformanceTimelineView from './Microcks.BarChart/ConformanceTimeline.svelte';
import GridAndOverlayView from './Microcks.BarChart/GridAndOverlay.svelte';
import PerHourView from './Microcks.BarChart/PerHour.svelte';
import PlaygroundView from './Microcks.BarChart/Playground.svelte';

export default {
  title: 'Microcks/BarChart',
  component: BarChart,
  parameters: itemParams(['bar-chart'], 'Selectable bar chart: one button per bar with a full label, one tab stop and arrow keys; axes and labels are hidden, and a visually hidden table is the text equivalent.'),
} satisfies Meta<typeof BarChart>;

const RUNS = Array.from({ length: 20 }, (_, i) => { const id = String(100 + i); const failed = i % 6 === 4; const ms = 700 + ((i * 337) % 1900); return { id, failed, ms }; });
export const ConformanceTimeline: StoryObj<typeof ConformanceTimelineView> = { name: 'Runs (Tests)', render: () => ({ Component: ConformanceTimelineView, props: {} }) };

/** `grid` lines, `ticksEnd` on the right, a `minHeight` for zero values and an `overlay`. */
export const GridAndOverlay: StoryObj<typeof GridAndOverlayView> = { name: 'Grid, end ticks and overlay', render: () => ({ Component: GridAndOverlayView, props: {} }) };

export const PerHour: StoryObj<typeof PerHourView> = { name: 'Per hour, future slots (Usage)', render: () => ({ Component: PerHourView, props: {} }) };

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof BarChart> = { render: (args) => ({ Component: PlaygroundView, props: args }),
  args: { label: 'Runs, oldest to newest. Use the arrow keys to move between bars.', bars: RUNS.map((r, i): BarChartBar => ({ id: r.id, value: r.ms, tone: r.failed ? 'danger' : 'success', label: i === 0 || i === RUNS.length - 1 || Number(r.id) % 5 === 0 ? r.id : '', description: `Run #${r.id}, ${r.failed ? 'failed' : 'passed'}, ${r.ms} ms` })), max: 3000, selectedId: '119', selection: 'outline', ticks: ['3 s','1.5 s','0'], ticksEnd: undefined, grid: undefined, height: undefined, gap: undefined, minHeight: undefined, table: { caption: 'Last 20 runs, oldest first', columns: ['Run','Result','Duration'], rows: RUNS.map(r => [`#${r.id}`, r.failed ? 'Failed' : 'Passed', `${r.ms} ms`]) } },
  argTypes: { selection: { control: 'inline-radio', options: ['outline','fill'] }, onselect: { table: { disable: true } } } };

