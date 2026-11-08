<script lang="ts" module>export type { OperationListProps } from './operation-row.js';</script>
<script lang="ts">
 import type { Snippet } from 'svelte'; import type { HTMLAttributes } from 'svelte/elements';
 type Props = Omit<HTMLAttributes<HTMLUListElement>, 'class' | 'children' | 'aria-label'> & { label: string; class?: string; children?: Snippet };
 let { label, class: cssClass, children, ...rest }: Props = $props();
</script>
<ul {...rest} aria-label={label} class={['operation-list', cssClass].filter(Boolean).join(' ')}>{#if children}{@render children()}{/if}</ul>
