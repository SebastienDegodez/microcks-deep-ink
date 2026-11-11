<script lang="ts">
  import '@microcks/demo-styles/pages/usage/chart.css';
  import { untrack } from 'svelte';
  import { formatCount, type UsageView } from '@microcks/demo-core/domain/observe';
  import { BarChart, Panel } from '@microcks/deep-ink';
  import { chartBars, chartLabel, chartTable, chartTicks } from './figures';

  /**
   * Invocations per hour (today) or per day (7 / 30 days) on the registry bar chart: one selectable bar per slot,
   * a 0 / half / max axis, dashed slots for the hours still to come, and the selection in the card header.
   */
  let { view }: { view: UsageView } = $props();
  const titleId = $props.id();
  let sel = $state(untrack(() => view.chart.defaultSelected));
  const chart = $derived(view.chart);
  const point = $derived(chart.points[sel]);
  const inProgress = $derived(view.period === 'today' && sel === chart.defaultSelected);
  const compact = $derived(chart.points.length > 24);
</script>

<Panel class="us-chart-card" padding="lg" aria-labelledby={titleId}
  ><div class="us-chart-head"
    ><div class="us-chart-title"><h2 id={titleId}>{chart.title}</h2><span>{chart.subtitle}</span></div
    ><span class="us-chart-selection" aria-live="polite"
      >{#if point}<span class="us-chart-selection-label">{point.name}{#if inProgress}{' (in progress)'}{/if}</span>{' '}<span
          class="us-chart-selection-value">{formatCount(point.value)}<!----> invocations</span
        >{/if}</span
    ></div
  ><BarChart
    label={chartLabel(chart)}
    bars={chartBars(chart)}
    max={chart.max}
    selectedId={String(sel)}
    onselect={(id) => (sel = Number(id))}
    selection="fill"
    height={200}
    gap={compact ? 3 : 6}
    minHeight={1}
    ticks={chartTicks(chart)}
    grid={[0, 0.5]}
    table={chartTable(chart)}
  /></Panel
>
