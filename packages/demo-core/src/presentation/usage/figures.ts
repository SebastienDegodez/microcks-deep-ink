import { formatCount, type HeatCell, type UsageView } from '../../domain/observe/index.js';

/** Tone of a conformance score: neutral when never tested, success from 80, warning from 50, else danger. */
export const scoreTone = (score: number | null): 'neutral' | 'success' | 'warning' | 'danger' =>
  score === null ? 'neutral' : score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger';

/** Direction of a trend or a growth in %: up, down or flat. */
export const trendDir = (pct: number) => (pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat');

/** "API Pastry 2.0" -> ["API Pastry", "2.0"]. */
export function splitVersion(name: string): [string, string | undefined] {
  const at = name.lastIndexOf(' ');
  return at > 0 ? [name.slice(0, at), name.slice(at + 1)] : [name, undefined];
}

/** Weekday labels of the heatmap rows, every other day as in the prototype. */
export const HEAT_ROW_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'] as const;

/** Figure of the conformance key figure: `Never tested` or `92%`. */
export const conformanceValue = (score: number | null) => (score === null ? 'Never tested' : `${score}%`);

/** Name of the bar chart, with how to move between its bars. */
export const chartLabel = (chart: UsageView['chart']) => `${chart.summary} One bar per ${chart.unit}, use the arrow keys to move between bars.`;

/** One bar per point of the chart, identified by its position. */
export const chartBars = (chart: UsageView['chart']): { id: string; value: number; description: string; label: string; future: boolean }[] =>
  chart.points.map((p, i) => ({
    id: String(i),
    value: p.value,
    description: `${p.name}: ${formatCount(p.value)} invocations`,
    label: p.tick,
    future: p.future,
  }));

/** Axis ticks of the chart: the maximum, its half and zero. */
export const chartTicks = (chart: UsageView['chart']) => [formatCount(chart.max), formatCount(Math.round(chart.max / 2)), '0'];

/** Hidden table of the chart: one row per hour or day, `not yet` for the slots still to come. */
export const chartTable = (chart: UsageView['chart']) => ({
  caption: chart.title,
  columns: [chart.unit === 'hour' ? 'Hour' : 'Day', 'Invocations'],
  rows: chart.points.map((p) => [p.name, p.future ? 'not yet' : formatCount(p.value)]),
});

/** Accessible name of a heatmap day: "Tue, Nov 3: 296 invocations". */
export const dayLabel = (c: HeatCell) => `${c.name}: ${formatCount(c.value)} invocations`;

/** Days still to come in the heatmap grid, after the last cell: their number, grid column and grid row. */
export const futureDays = (heatmap: UsageView['heatmap']) =>
  Array.from({ length: heatmap.months.length * 7 - heatmap.cells.length }, (_, i) => {
    const day = heatmap.cells.length + i;
    return { day, column: Math.floor(day / 7) + 2, row: (day % 7) + 2 };
  });
