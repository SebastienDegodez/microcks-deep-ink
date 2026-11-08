<script lang="ts" module>export type { FilterBarProps } from './filter-bar.js';</script>
<script lang="ts">
 import type { Snippet } from 'svelte'; import type { HTMLAttributes } from 'svelte/elements';
 type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> & { label: string; class?: string; children?: Snippet };
 let { label, class: cssClass, children, ...rest }: Props = $props();
</script>
<section {...rest} aria-label={label} class={['filter-bar', cssClass].filter(Boolean).join(' ')}>{#if children}{@render children()}{/if}</section>
