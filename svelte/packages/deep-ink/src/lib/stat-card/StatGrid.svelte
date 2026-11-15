<script lang="ts">
 import type { Snippet } from 'svelte'; import type { HTMLAttributes } from 'svelte/elements';
 type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> & { label: string; class?: string; children?: Snippet };
 let { label, class: cssClass, children, ...rest }: Props = $props();
</script>
<section {...rest} aria-label={label} class={['stat-grid', cssClass].filter(Boolean).join(' ')}>{#if children}{@render children()}{/if}</section>
