<script lang="ts" module>export type { OperationRowProps } from './operation-row.js';</script>
<script lang="ts">
 import type { Snippet } from 'svelte'; import type { HTMLAttributes } from 'svelte/elements'; import MethodTag from '../MethodTag.svelte'; import MockUrl from '../mock-url/MockUrl.svelte'; import type { Protocol } from '../types.js';
 type Props = Omit<HTMLAttributes<HTMLLIElement>, 'class' | 'children' | 'onselect'> & { method: string; path: string; protocol?: Protocol; meta?: string; mockUrl?: string; selected?: boolean; href?: string; onselect?: () => void; class?: string; children?: Snippet };
 let { method, path, protocol = 'REST', meta, mockUrl, selected, href, onselect, class: cssClass, children, ...rest }: Props = $props();
</script>
<li {...rest} class={['operation-row', cssClass].filter(Boolean).join(' ')} data-selected={selected ? '' : undefined}>
 {#if href}<a class="operation-link" {href} aria-current={selected ? 'true' : undefined}><MethodTag {method} {protocol} /><span class="operation-path">{path}</span>{#if meta}<span class="operation-meta">{meta}</span>{/if}{#if children}{@render children()}{/if}</a>
 {:else if onselect}<button type="button" class="operation-link" aria-current={selected ? 'true' : undefined} onclick={onselect}><MethodTag {method} {protocol} /><span class="operation-path">{path}</span>{#if meta}<span class="operation-meta">{meta}</span>{/if}{#if children}{@render children()}{/if}</button>
 {:else}<div class="operation-link"><MethodTag {method} {protocol} /><span class="operation-path">{path}</span>{#if meta}<span class="operation-meta">{meta}</span>{/if}{#if children}{@render children()}{/if}</div>{/if}
 {#if selected && mockUrl}<div class="operation-mock"><MockUrl url={mockUrl} {method} bare /></div>{/if}
</li>
