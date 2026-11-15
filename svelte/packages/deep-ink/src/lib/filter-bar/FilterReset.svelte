<script lang="ts" module>export type { FilterResetProps } from './filter-bar.js';</script>
<script lang="ts">
 import type { Snippet } from 'svelte'; import type { HTMLAttributes } from 'svelte/elements'; import Icon from '../icon/Icon.svelte';
 type Props = Omit<HTMLAttributes<HTMLButtonElement>, 'class' | 'children'> & { count?: number; label?: string | Snippet; class?: string };
 let { count, label = 'Reset', class: cssClass, ...rest }: Props = $props();
</script>
<button type="button" disabled={count === 0} {...rest} class={['filter-bar-reset', cssClass].filter(Boolean).join(' ')}><Icon name="reset" size={14} />{#if typeof label === 'function'}{@render label()}{:else}{label}{/if}{count !== undefined ? ` (${count})` : ''}</button>
