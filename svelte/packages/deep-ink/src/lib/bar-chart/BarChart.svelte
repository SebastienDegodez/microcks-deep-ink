<script lang="ts">
  import type { BarChartProps, BarChartBar } from './types.js';
  let { label, bars, max, selectedId, onselect, selection = 'outline', ticks, ticksEnd, grid = [0, 0.5], height, gap, minHeight = 2, overlay, table, class: cssClass }: BarChartProps = $props();
  let group: HTMLDivElement;
  const selectable = $derived(bars.map((b, i) => b.future ? -1 : i).filter(i => i >= 0));
  const selIndex = $derived(bars.findIndex(b => b.id === selectedId && !b.future));
  const tabStop = $derived(selIndex >= 0 ? selIndex : (selectable[selectable.length - 1] ?? -1));
  const vars = $derived([height ? `--bar-chart-height:${height}px` : '', gap !== undefined ? `--bar-chart-gap:${gap}px` : ''].filter(Boolean).join(';'));
  const pct = (b: BarChartBar) => max <= 0 ? 0 : Math.min(100, Math.max(b.value > 0 ? minHeight : 0, b.value / max * 100));
  function keydown(e: KeyboardEvent, index: number) {
    const pos = selectable.indexOf(index);
    const to = e.key === 'ArrowRight' ? selectable[Math.min(pos + 1, selectable.length - 1)]
      : e.key === 'ArrowLeft' ? selectable[Math.max(pos - 1, 0)]
      : e.key === 'Home' ? selectable[0] : e.key === 'End' ? selectable[selectable.length - 1] : undefined;
    if (to === undefined) return;
    e.preventDefault();
    const bar = bars[to];
    if (bar) onselect(bar.id);
    group.querySelectorAll<HTMLButtonElement>('button')[selectable.indexOf(to)]?.focus();
  }
</script>
<div class={['bar-chart', cssClass]} data-selection={selection} style={vars || undefined}>
  {#if ticks}<div class="bar-chart-axis" aria-hidden="true">{#each ticks as t, i (i)}<span>{t}</span>{/each}</div>{/if}
  <div class="bar-chart-main">
    <div class="bar-chart-plot">
      {#each grid as g (g)}<div class="bar-chart-grid" aria-hidden="true" style={`top:${g * 100}%`}></div>{/each}
      <div class="bar-chart-bars" role="group" aria-label={label} bind:this={group}>
        {#each bars as b, i (b.id)}
          {#if b.future}<div class="bar-chart-cell" aria-hidden="true"><span class="bar-chart-future"></span></div>
          {:else}<div class="bar-chart-cell" data-faded={b.faded ? '' : undefined}>
            {#if b.cap}<span class="bar-chart-cap" aria-hidden="true" style={`bottom:calc(${pct(b)}% + 2px)`}>{b.cap}</span>{/if}
            <button type="button" class="bar-chart-bar" aria-pressed={i === selIndex} aria-label={b.description} tabindex={i === tabStop ? 0 : -1} onclick={() => onselect(b.id)} onkeydown={e => keydown(e, i)}><span class="bar-chart-fill" data-tone={b.tone && b.tone !== 'action' ? b.tone : undefined} style={`height:${pct(b)}%`}></span></button>
          </div>{/if}
        {/each}
      </div>
      {#if overlay}<div class="bar-chart-overlay" aria-hidden="true">{@render overlay()}</div>{/if}
    </div>
    <div class="bar-chart-labels" aria-hidden="true">{#each bars as b, i (b.id)}<span data-selected={i === selIndex ? '' : undefined}>{b.label ?? ''}</span>{/each}</div>
  </div>
  {#if ticksEnd}<div class="bar-chart-axis" data-side="end" aria-hidden="true">{#each ticksEnd as t, i (i)}<span>{t}</span>{/each}</div>{/if}
</div>
<table class="sr-only"><caption>{table.caption}</caption><thead><tr>{#each table.columns as c, i (i)}<th scope="col">{c}</th>{/each}</tr></thead><tbody>{#each table.rows as r, i (i)}<tr>{#each r as cell, j (j)}{#if j === 0}<th scope="row">{cell}</th>{:else}<td>{cell}</td>{/if}{/each}</tr>{/each}</tbody></table>
