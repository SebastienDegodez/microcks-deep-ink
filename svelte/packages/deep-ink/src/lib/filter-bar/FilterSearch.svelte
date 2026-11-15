<script lang="ts" module>export type { FilterSearchProps } from './filter-bar.js';</script>
<script lang="ts">
 import type { HTMLInputAttributes } from 'svelte/elements'; import Icon from '../icon/Icon.svelte';
 type Props = Omit<HTMLInputAttributes, 'class' | 'type' | 'size'> & { label: string; placeholder?: string; size?: 'md' | 'lg'; class?: string };
 let { label, placeholder, size = 'md', class: cssClass, ...rest }: Props = $props();
</script>
<label class={['filter-bar-search', cssClass].filter(Boolean).join(' ')} data-size={size}><Icon name="search" size={16} /><span class="sr-only">{label}</span><input type="search" placeholder={placeholder ?? label} {...rest} /></label>
