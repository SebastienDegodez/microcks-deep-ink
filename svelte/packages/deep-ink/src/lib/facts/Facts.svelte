<!--
  Key/value facts of an object in a native <dl> (registry item facts). Same props as the React Facts: items, layout,
  boxed, strong, termWidth, columns, size, gap, values, lineHeight, mono, wrap, className, style (a string here) plus
  any <dl> attribute and React handler (onClick...). A fact's `term`, `value` and `sub` (ReactNode in React) take a
  string or a snippet; extra FactRows after the items are the children.
-->
<script lang="ts" module>
  import type { Snippet } from 'svelte';
  import type { FactTone } from './FactRow.svelte';

  export interface Fact {
    term: string | Snippet;
    value: string | number | Snippet;
    /** Muted 12px line under the value. */
    sub?: string | Snippet;
    /** Monospace 12px value (ids, paths, versions). */
    mono?: boolean;
    /** Colour of the value. The words must carry the meaning too. */
    tone?: FactTone;
    /** Key; defaults to the position. */
    id?: string;
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';
  import FactRow from './FactRow.svelte';
  import { withVars } from '../style';

  type Props = Omit<HTMLAttributes<HTMLDListElement>, 'class' | 'children'> &
    ReactHandlers<HTMLDListElement> & {
    items?: Fact[];
    /** `rows` (default): term column + separators. `inline`: two-column grid. `columns`: term over value. */
    layout?: 'rows' | 'inline' | 'columns';
    /** Frames the list on the page background; `surface`: on the surface fill; `compact`: padding 8px 12px, radius 4. */
    boxed?: boolean | 'surface' | 'compact';
    /** 14px 600 values (figures). */
    strong?: boolean;
    /** Width of the term column in `rows` (130px) and `inline` (92px): `150px`. */
    termWidth?: string;
    /** `columns` only: a fixed number of equal columns instead of auto-fit. */
    columns?: number;
    /** `sm`: 11px terms with a normal line height. `md` (default). `lg`: 14px text, 8px rows, 14px mono values. */
    size?: 'sm' | 'md' | 'lg';
    /** `inline` and `columns`: the grid gap, row then column (default `8px 16px`). */
    gap?: string;
    /** `secondary`: values in --text-secondary, and the `muted` tone drops to --text-muted. Default `text`. */
    values?: 'text' | 'secondary';
    /** `relaxed`: values at line height 1.6. Default `inherit`. */
    lineHeight?: 'inherit' | 'relaxed';
    /** Terms and values in 12px/1.6 monospace (request bodies). */
    mono?: boolean;
    /** `pre`: terms and values keep line breaks and spaces and break anywhere. Default `normal`. */
    wrap?: 'normal' | 'pre';
    className?: string;
    /** Extra FactRows after the items. */
    children?: Snippet;
  };

  let {
    items = [],
    layout = 'rows',
    boxed,
    strong,
    termWidth,
    columns,
    gap,
    size = 'md',
    values = 'text',
    lineHeight = 'inherit',
    mono,
    wrap = 'normal',
    className,
    style,
    children,
    ...rest
  }: Props = $props();

  const css = $derived(
    withVars({ '--facts-term': termWidth, '--facts-gap': gap, '--facts-cols': !!columns && `repeat(${columns}, minmax(0, 1fr))` }, style),
  );
</script>

<dl
  {...reactEvents(rest)}
  class={['facts', className].filter(Boolean).join(' ')}
  data-layout={layout === 'rows' ? undefined : layout}
  data-boxed={boxed === 'surface' || boxed === 'compact' ? boxed : boxed ? '' : undefined}
  data-strong={strong ? '' : undefined}
  data-size={size === 'md' ? undefined : size}
  data-values={values === 'text' ? undefined : values}
  data-line-height={lineHeight === 'inherit' ? undefined : lineHeight}
  data-mono={mono ? '' : undefined}
  data-wrap={wrap === 'normal' ? undefined : wrap}
  style={css}
  >{#each items as f, i (f.id ?? i)}<FactRow term={f.term} sub={f.sub} mono={f.mono} tone={f.tone}
      >{#if typeof f.value === 'function'}{@render f.value()}{:else}{f.value}{/if}</FactRow
    >{/each}{@render children?.()}</dl
>
