<script lang="ts" module>export type { FilterRowProps } from './filter-bar.js';</script>
<script lang="ts">
 import type { Snippet } from 'svelte'; import type { HTMLAttributes } from 'svelte/elements';
 type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> & { title?: string; class?: string; children?: Snippet };
 let { title, class: cssClass, children, ...rest }: Props = $props(); const id = $props.id();
</script>
<div {...rest} class={['filter-bar-row', cssClass].filter(Boolean).join(' ')} role={title ? 'group' : undefined} aria-labelledby={title ? id : undefined}>{#if title}<span class="filter-bar-label" id={id}>{title}</span>{/if}{#if children}{@render children()}{/if}</div>
