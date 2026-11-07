<!--
  Selectable bar chart: one button per bar, one tab stop, arrow keys (Left, Right, Home, End) and a visually hidden
  table (registry item bar-chart). Same props as the React BarChart: label, bars, max, selectedId, onSelect, selection,
  ticks, ticksEnd, grid, height, gap, minHeight, overlay, table, className. `overlay` (ReactNode in React) is a string
  or a snippet. As in React, nothing else is forwarded.
-->
<script lang="ts" module>
  import type { Snippet } from 'svelte';

  export type BarTone = 'action' | 'success' | 'danger' | 'warning' | 'running';

  export interface BarChartBar {
    id: string;
    value: number;
    /** Full accessible name: "Run #118, failed, 1.84 s, 6/7 samples passed". */
    description: string;
    /** X label under the bar; empty to skip it. */
    label?: string;
    tone?: BarTone;
    /** A slot still to come: a dashed frame, not selectable. */
    future?: boolean;
    /** Dimmed (outside the filters); stays selectable. */
    faded?: boolean;
    /** Text above the bar (a capped value: "12 s"). */
    cap?: string;
  }

  export interface BarChartTable {
    caption: string;
    columns: string[];
    /** One row per bar; the first cell is the row header. */
    rows: string[][];
  }
</script>

<script lang="ts">
  type Props = {
    /** Name of the bar group, with how to move: "Runs, oldest to newest. Use the arrow keys to move between bars." */
    label: string;
    bars: BarChartBar[];
    /** Value of a full-height bar. */
    max: number;
    selectedId?: string;
    onSelect: (id: string) => void;
    /** `outline` (default): the selected bar is outlined. `fill`: it takes the --link fill. */
    selection?: 'outline' | 'fill';
    /** Left axis labels, top to bottom ("3 s", "1.5 s", "0"). */
    ticks?: string[];
    /** Right axis labels, top to bottom, in --link (a second measure, like the overlay line). */
    ticksEnd?: string[];
    /** Dashed gridlines, as fractions from the top (default 0 and .5). */
    grid?: number[];
    /** Plot height in px (160). */
    height?: number;
    /** Gap between bars in px (4). */
    gap?: number;
    /** Smallest visible bar, in % (2). */
    minHeight?: number;
    /** Decorative layer over the bars (an SVG line). */
    overlay?: string | Snippet;
    /** The text equivalent, rendered as a visually hidden table. */
    table: BarChartTable;
    className?: string;
  };

  let {
    label,
    bars,
    max,
    selectedId,
    onSelect,
    selection = 'outline',
    ticks,
    ticksEnd,
    grid = [0, 0.5],
    height,
    gap,
    minHeight = 2,
    overlay,
    table,
    className,
  }: Props = $props();

  const refs: Array<HTMLButtonElement | undefined> = $state([]);
  const selectable = $derived(bars.map((b, i) => (b.future ? -1 : i)).filter((i) => i >= 0));
  const selIndex = $derived(bars.findIndex((b) => b.id === selectedId && !b.future));
  const tabStop = $derived(selIndex >= 0 ? selIndex : (selectable[selectable.length - 1] ?? -1));
  const vars = $derived(
    [height ? `--bar-chart-height:${height}px` : '', gap !== undefined ? `--bar-chart-gap:${gap}px` : ''].filter(Boolean).join(';') ||
      undefined,
  );

  function onkeydown(e: KeyboardEvent, index: number) {
    const pos = selectable.indexOf(index);
    const to =
      e.key === 'ArrowRight' ? selectable[Math.min(pos + 1, selectable.length - 1)]
      : e.key === 'ArrowLeft' ? selectable[Math.max(pos - 1, 0)]
      : e.key === 'Home' ? selectable[0]
      : e.key === 'End' ? selectable[selectable.length - 1]
      : undefined;
    if (to === undefined) return;
    e.preventDefault();
    const bar = bars[to];
    if (bar) onSelect(bar.id);
    refs[to]?.focus();
  }

  const pct = (b: BarChartBar) => (max <= 0 ? 0 : Math.min(100, Math.max(b.value > 0 ? minHeight : 0, (b.value / max) * 100)));
</script>

<div class={['bar-chart', className].filter(Boolean).join(' ')} data-selection={selection} style={vars}
  >{#if ticks}<div class="bar-chart-axis" aria-hidden="true">{#each ticks as t, i (i)}<span>{t}</span>{/each}</div>{/if}<div
    class="bar-chart-main"
    ><div class="bar-chart-plot"
      >{#each grid as g (g)}<div class="bar-chart-grid" aria-hidden="true" style="top:{g * 100}%"></div>{/each}<div
        class="bar-chart-bars"
        role="group"
        aria-label={label}
        >{#each bars as b, i (b.id)}{#if b.future}<div class="bar-chart-cell" aria-hidden="true"
              ><span class="bar-chart-future"></span></div
            >{:else}<div class="bar-chart-cell" data-faded={b.faded ? '' : undefined}
              >{#if b.cap}<span class="bar-chart-cap" aria-hidden="true" style="bottom:calc({pct(b)}% + 2px)">{b.cap}</span
                >{/if}<button
                bind:this={refs[i]}
                type="button"
                class="bar-chart-bar"
                aria-pressed={i === selIndex ? 'true' : 'false'}
                aria-label={b.description}
                tabindex={i === tabStop ? 0 : -1}
                onclick={() => onSelect(b.id)}
                onkeydown={(e) => onkeydown(e, i)}
                ><span
                  class="bar-chart-fill"
                  data-tone={b.tone && b.tone !== 'action' ? b.tone : undefined}
                  style="height:{pct(b)}%"></span
                ></button
              ></div
            >{/if}{/each}</div
      >{#if overlay}<div class="bar-chart-overlay" aria-hidden="true"
          >{#if typeof overlay === 'function'}{@render overlay()}{:else}{overlay}{/if}</div
        >{/if}</div
    ><div class="bar-chart-labels" aria-hidden="true"
      >{#each bars as b, i (b.id)}<span data-selected={i === selIndex ? '' : undefined}>{b.label ?? ''}</span>{/each}</div
    ></div
  >{#if ticksEnd}<div class="bar-chart-axis" data-side="end" aria-hidden="true"
      >{#each ticksEnd as t, i (i)}<span>{t}</span>{/each}</div
    >{/if}</div
><table class="sr-only"
  ><caption>{table.caption}</caption><thead
    ><tr>{#each table.columns as c (c)}<th scope="col">{c}</th>{/each}</tr></thead
  ><tbody
    >{#each table.rows as r, i (i)}<tr
        >{#each r as cell, j (j)}{#if j === 0}<th scope="row">{cell}</th>{:else}<td>{cell}</td>{/if}{/each}</tr
      >{/each}</tbody
  ></table
>
