<script lang="ts" module>export type { Fact, FactsProps, FactTone } from './facts.js';</script>
<script lang="ts">
 import type { Snippet } from 'svelte'; import type { HTMLAttributes } from 'svelte/elements'; import FactRow from './FactRow.svelte'; import type { Fact } from './facts.js';
 type Props = Omit<HTMLAttributes<HTMLDListElement>, 'class' | 'children'> & { items?: Fact[]; layout?: 'rows' | 'inline' | 'columns'; boxed?: boolean | 'surface' | 'compact'; strong?: boolean; termWidth?: string; columns?: number; size?: 'sm' | 'md' | 'lg'; gap?: string; values?: 'text' | 'secondary'; lineHeight?: 'inherit' | 'relaxed'; mono?: boolean; wrap?: 'normal' | 'pre'; class?: string; children?: Snippet };
 let { items = [], layout = 'rows', boxed, strong, termWidth, columns, gap, size = 'md', values = 'text', lineHeight = 'inherit', mono, wrap = 'normal', class: cssClass, style, children, ...rest }: Props = $props();
 const vars = $derived([termWidth ? `--facts-term:${termWidth}` : '', gap ? `--facts-gap:${gap}` : '', columns ? `--facts-cols:repeat(${columns}, minmax(0, 1fr))` : ''].filter(Boolean).join(';'));
</script>
<dl {...rest} class={['facts', cssClass].filter(Boolean).join(' ')} data-layout={layout === 'rows' ? undefined : layout} data-boxed={boxed === 'surface' || boxed === 'compact' ? boxed : boxed ? '' : undefined} data-strong={strong ? '' : undefined} data-size={size === 'md' ? undefined : size} data-values={values === 'text' ? undefined : values} data-line-height={lineHeight === 'inherit' ? undefined : lineHeight} data-mono={mono ? '' : undefined} data-wrap={wrap === 'normal' ? undefined : wrap} style={[vars, style].filter(Boolean).join(';')}>
 {#each items as f, i (f.id ?? (typeof f.term === 'string' ? f.term : i))}<FactRow term={f.term} sub={f.sub} mono={f.mono} tone={f.tone}>{#if typeof f.value === 'function'}{@render f.value()}{:else}{f.value}{/if}</FactRow>{/each}{#if children}{@render children()}{/if}
</dl>
