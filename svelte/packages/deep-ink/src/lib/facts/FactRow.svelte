<script lang="ts" module>export type { FactRowProps, FactTone } from './facts.js';</script>
<script lang="ts">
 import type { Snippet } from 'svelte'; import type { HTMLAttributes } from 'svelte/elements'; import type { FactTone } from './facts.js';
 type Content = string | Snippet;
 type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> & { term: Content; sub?: Content; mono?: boolean; tone?: FactTone; class?: string; children?: Snippet };
 let { term, sub, mono, tone, class: cssClass, children, ...rest }: Props = $props();
</script>
{#snippet node(value: Content)}{#if typeof value === 'function'}{@render value()}{:else}{value}{/if}{/snippet}
<div {...rest} class={['facts-row', cssClass].filter(Boolean).join(' ')}><dt>{@render node(term)}</dt><dd data-mono={mono ? '' : undefined} data-tone={tone}>{#if sub}<span>{#if children}{@render children()}{/if}</span><span class="facts-sub">{@render node(sub)}</span>{:else}{#if children}{@render children()}{/if}{/if}</dd></div>
