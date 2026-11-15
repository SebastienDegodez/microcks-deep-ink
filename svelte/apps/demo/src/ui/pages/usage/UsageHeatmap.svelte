<script lang="ts">
  import '@microcks/demo-styles/pages/usage/heatmap.css';
  import { untrack } from 'svelte';
  import { WEEKDAY_HEADERS, formatCount, heatmapWeeks, type UsageView } from '@microcks/demo-core/domain/observe';
  import { Facts, Panel } from '@microcks/deep-ink';
  import { useRovingSelection } from '../tests/roving';
  import { HEAT_ROW_LABELS, dayLabel, futureDays } from './figures';

  /** Daily calendar of the last 12 weeks: one button per day, 4 heat steps, legend and three key figures. */
  let { view }: { view: UsageView } = $props();
  const titleId = $props.id();
  let sel = $state(untrack(() => view.heatmap.defaultSelected));
  const heatmap = $derived(view.heatmap);
  const byPos = $derived(new Map(heatmap.cells.map((c) => [`${c.week}:${c.weekday}`, c.index])));
  const roving = useRovingSelection(
    (i) => (sel = i),
    (i, key) => {
      const cell = heatmap.cells.find((c) => c.index === i);
      if (!cell) return undefined;
      const move: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
      const delta = move[key];
      return delta ? byPos.get(`${cell.week + delta[0]}:${cell.weekday + delta[1]}`) : undefined;
    },
  );
  const cell = $derived(heatmap.cells.find((c) => c.index === sel));
  const weeks = $derived(heatmapWeeks(heatmap.cells));
  const lastDay = $derived(heatmap.cells.length - 1);
</script>

<Panel class="us-heat-card" padding="lg" aria-labelledby={titleId}
  ><div class="us-heat-head"><h2 id={titleId}>Daily invocations · last 12 weeks</h2><span>{heatmap.subtitle}</span></div
  ><div
    class="us-heat"
    role="group"
    aria-label="Calendar heatmap, one button per day. Use the arrow keys to move between days."
    style="--heat-weeks: {heatmap.months.length}"
    >{#each heatmap.months as m, w (w)}<span class="us-heat-month" aria-hidden="true" style="grid-column: {w + 2}; grid-row: 1">{m}</span
      >{/each}{#each HEAT_ROW_LABELS as d, r (r)}<span class="us-heat-weekday" aria-hidden="true" style="grid-column: 1; grid-row: {r + 2}">{d}</span
      >{/each}{#each heatmap.cells as c (c.index)}<button
        {@attach roving.register(c.index)}
        type="button"
        class="us-day"
        data-level={c.level}
        style="grid-column: {c.week + 2}; grid-row: {c.weekday + 2}"
        aria-pressed={c.index === sel}
        tabindex={c.index === sel ? 0 : -1}
        aria-label={dayLabel(c)}
        onclick={() => (sel = c.index)}
        onkeydown={roving.onKeyDown(c.index)}
      ></button>{/each}{#each futureDays(heatmap) as f (f.day)}<span
        class="us-day-future"
        aria-hidden="true"
        style="grid-column: {f.column}; grid-row: {f.row}"
      ></span>{/each}</div
  ><div class="us-heat-foot"
    ><span aria-live="polite"
      >{#if cell}<span class="us-heat-sel-day">{cell.name}{#if cell.index === lastDay}{` ${heatmap.todayNote}`}{/if}</span>{' '}<span
          class="us-heat-sel-value">{formatCount(cell.value)}<!----> invocations</span
        >{/if}</span
    ><span class="us-heat-legend" aria-hidden="true"
      >Less{#each [0, 1, 2, 3, 4] as l (l)}<span class="us-heat-swatch" data-level={l === 0 ? 'none' : l - 1}></span>{/each}More</span
    ></div
  ><Facts
    layout="columns"
    columns={3}
    gap="10px"
    size="sm"
    strong
    class="us-heat-facts"
    items={[
      { term: '12-week total', value: formatCount(heatmap.total), mono: true },
      { term: 'Weekday average', value: formatCount(heatmap.weekdayAverage), mono: true },
      { term: 'Busiest day', value: heatmap.busiest, mono: true },
    ]}
  /><table class="sr-only"
    ><caption>Invocations per week and weekday</caption><thead
      ><tr><th scope="col">Week of</th>{#each WEEKDAY_HEADERS as d (d)}<th scope="col">{d}</th>{/each}</tr></thead
    ><tbody
      >{#each weeks as w (w.week)}<tr
          ><th scope="row">{w.week}</th>{#each w.values as v, i (i)}<td>{v === null ? 'not yet' : formatCount(v)}</td>{/each}</tr
        >{/each}</tbody
    ></table
  ></Panel
>
