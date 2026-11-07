<!--
  Data table (registry item table): real <caption>, th scope, aria-sort, a focusable scroll region; no clickable <tr>.
  Same props as the React DataTable: caption, captionHidden, columns, rows, rowKey, rowHref, renderRowLink, selectedKey,
  sort, onSortChange, emptyText, density, headerCase, rowTone, scroll, layout, onRowSelect, className. A column's
  `render` and `renderRowLink` (ReactNode functions in React) are snippets: `renderRowLink(row, props)` gets the
  RowLinkProps, whose `children` snippet is the cell content.
-->
<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import Icon from '../icon/Icon.svelte';
  import type { DataTableColumn, RowLinkProps, SortState } from './table';

  type Props = {
    /** Visible table title (a real `<caption>`). */
    caption: string;
    /** Keeps the caption for assistive technology only. */
    captionHidden?: boolean;
    columns: DataTableColumn<T>[];
    rows: T[];
    /** Unique key of a row: a property name or a function. */
    rowKey: (keyof T & string) | ((row: T) => string);
    /** Makes the first cell a link stretched over the whole row. */
    rowHref?: (row: T) => string;
    /** Renders the row link yourself, for router links. */
    renderRowLink?: Snippet<[T, RowLinkProps]>;
    selectedKey?: string;
    sort?: SortState;
    /** Called when a sort button is activated. The caller sorts `rows`. */
    onSortChange?: (sort: SortState) => void;
    emptyText?: string;
    density?: 'comfortable' | 'compact';
    headerCase?: 'upper' | 'sentence';
    rowTone?: (row: T) => 'failed' | 'danger' | 'idle' | undefined;
    /** `false`: a plain wrapper, no region and no tab stop, for a table that never overflows. */
    scroll?: boolean;
    layout?: 'auto' | 'fixed';
    /** Makes the row header of each row a toggle button (`aria-pressed`) that selects the row. */
    onRowSelect?: (row: T) => void;
    className?: string;
  };

  let {
    caption,
    captionHidden,
    columns,
    rows,
    rowKey,
    rowHref,
    renderRowLink,
    selectedKey,
    sort,
    onSortChange,
    emptyText = 'Nothing here yet.',
    density = 'comfortable',
    headerCase = 'upper',
    rowTone,
    scroll = true,
    layout = 'auto',
    onRowSelect,
    className,
  }: Props = $props();

  // In an expression, so that the compiler keeps its trailing space.
  const selectedWord = 'Selected: ';
  const captionId = $props.id();
  const keyOf = (row: T) => (typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey]));
  const text = (row: T, col: DataTableColumn<T>) => {
    const v = (row as Record<string, unknown>)[col.key];
    return v === undefined || v === null ? '' : String(v);
  };
  const nextSort = (key: string): SortState => ({
    key,
    direction: sort?.key === key && sort.direction === 'ascending' ? 'descending' : 'ascending',
  });
  const sortedColumn = $derived(sort ? columns.find((c) => c.key === sort.key) : undefined);
  const wrap = $derived(scroll ? { role: 'region', 'aria-labelledby': captionId, tabindex: 0 } : { 'data-scroll': 'false' });
</script>

{#snippet value(row: T, c: DataTableColumn<T>)}{#if c.render}{@render c.render(row)}{:else}{text(row, c)}{/if}{/snippet}

<div class={['table-wrap', className].filter(Boolean).join(' ')} {...wrap}>
  <table
    class="table"
    data-density={density}
    data-header={headerCase === 'sentence' ? 'sentence' : undefined}
    data-layout={layout === 'fixed' ? 'fixed' : undefined}
  >
    <caption id={captionId} class={captionHidden ? 'sr-only' : undefined}>{caption}</caption>
    <thead>
      <tr>
        {#each columns as c (c.key)}
          {@const active = sort?.key === c.key ? sort.direction : undefined}
          <th
            scope="col"
            data-align={c.align === 'end' ? 'end' : undefined}
            aria-sort={c.sortable ? active : undefined}
            style={c.width ? `width:${c.width}` : undefined}
            >{#if c.sortable}<button type="button" class="table-sort" onclick={() => onSortChange?.(nextSort(c.key))}
                >{c.header}<Icon name={active === 'descending' ? 'arrow-down' : active === 'ascending' ? 'arrow-up' : 'dash'} size={12} /></button
              >{:else if c.headerHidden}<span class="sr-only">{c.header}</span>{:else}{c.header}{/if}</th
          >
        {/each}
      </tr>
    </thead>
    <tbody>
      {#if rows.length === 0}
        <tr><td class="table-empty" colspan={Math.max(columns.length, 1)}>{emptyText}</td></tr>
      {:else}
        {#each rows as row (keyOf(row))}
          {@const selected = selectedKey !== undefined && keyOf(row) === selectedKey}
          {@const href = rowHref?.(row)}
          <tr data-selected={selected ? '' : undefined} data-tone={rowTone?.(row)}>
            {#each columns as c, i (c.key)}
              {#snippet content()}{@render value(row, c)}{/snippet}
              {#snippet inner()}{#if i === 0 && href !== undefined}{@const props: RowLinkProps = {
                    className: 'table-rowlink',
                    href,
                    'aria-current': selected ? 'true' : undefined,
                    children: content,
                  }}{#if renderRowLink}{@render renderRowLink(row, props)}{:else}<a
                      class={props.className}
                      href={props.href}
                      aria-current={props['aria-current']}>{@render content()}</a
                    >{/if}{:else if c.rowHeader && onRowSelect}<button
                    type="button"
                    class="table-pick"
                    aria-pressed={selected}
                    onclick={() => onRowSelect(row)}>{@render content()}</button
                  >{:else if i === 0 && selected}<span class="sr-only">{selectedWord}</span>{@render content()}{:else}{@render
                    content()}{/if}{/snippet}
              {#if c.rowHeader}
                <th
                  scope="row"
                  data-align={c.align === 'end' ? 'end' : undefined}
                  data-mono={c.mono ? '' : undefined}
                  data-nowrap={c.nowrap ? '' : undefined}>{@render inner()}</th
                >
              {:else}
                <td
                  data-align={c.align === 'end' ? 'end' : undefined}
                  data-mono={c.mono ? '' : undefined}
                  data-nowrap={c.nowrap ? '' : undefined}>{@render inner()}</td
                >
              {/if}
            {/each}
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
  <!-- Announces a sort change; the sorted header also exposes aria-sort. -->
  <span role="status" aria-live="polite" class="sr-only"
    >{sort && sortedColumn ? `Sorted by ${sortedColumn.header}, ${sort.direction}` : ''}</span
  >
</div>
