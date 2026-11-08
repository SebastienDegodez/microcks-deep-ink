<script lang="ts">
  import type { ConformanceMatrixProps, MatrixCell } from './types.js';
  import { cellKey } from './model.js';
  import { MATRIX_RESULT } from './internal/result.js';
  import Icon from '../icon/Icon.svelte';
  let { caption, columns, groups, footer, selectedKey, onselectcell, class: cssClass, ...rest }: ConformanceMatrixProps = $props();
  const span = $derived(columns.length);
  const space = ' ';
  const groupPrefix = ' · ';
  const finished = (cell: MatrixCell) => ['pass', 'fail', 'warn'].includes(cell.result);
</script>
{#snippet body(cell: MatrixCell)}<Icon name={MATRIX_RESULT[cell.result].icon} size={14}/><span>{cell.label ?? MATRIX_RESULT[cell.result].word}</span>{space}{#if finished(cell) && cell.duration}<span class="matrix-ms">{cell.duration}</span>{/if}{/snippet}
<!-- The overflow region must be keyboard-scrollable. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div {...rest} class={['matrix-wrap', cssClass]} role="region" aria-label={caption} tabindex="0">
  <table class="matrix" style={`--matrix-columns:${span}`}>
    <caption class="sr-only">{caption}</caption>
    <thead><tr><th scope="col">Check</th>{#each columns as c (c.id)}<th scope="col"><span>{c.label}</span>{#if c.sub}<span class="matrix-sub">{c.sub}</span>{/if}</th>{/each}</tr></thead>
    {#each groups as g (g.id)}<tbody><tr class="matrix-group"><th scope="rowgroup" colspan={span + 1}>{g.label}{#if g.sub}<span class="matrix-sub">{groupPrefix}{g.sub}</span>{/if}</th></tr>
      {#each g.rows as r (r.id)}<tr><th scope="row" data-mono={r.mono ? '' : undefined}><span>{r.label}</span>{#if r.sub}<span class="matrix-sub">{r.sub}</span>{/if}</th>
        {#each r.cells as cell (cellKey(r.id, cell.columnId))}
          {@const key = cellKey(r.id, cell.columnId)}
          {@const col = columns.find(c => c.id === cell.columnId)}
          <td colspan={cell.columnId ? 1 : span} data-result={cell.result}>{#if finished(cell) && onselectcell}<button type="button" class="matrix-cell" aria-pressed={selectedKey === key} onclick={() => onselectcell?.(selectedKey === key ? undefined : key)}><span class="sr-only">{`${col ? `${col.label} × ` : ''}${r.label}:`}</span>{space}{@render body(cell)}</button>{:else}<span class="matrix-cell">{@render body(cell)}</span>{/if}</td>
        {/each}
      </tr>{/each}
    </tbody>{/each}
    {#if footer}<tfoot><tr><th scope="row">{footer.label}</th>{#each footer.cells as c, i (i)}<td data-tone={c.tone}>{c.text}</td>{/each}</tr></tfoot>{/if}
  </table>
</div>
