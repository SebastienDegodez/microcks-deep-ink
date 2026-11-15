<script lang="ts">
  import { EmptyState } from '@microcks/deep-ink';
  import type { ComponentProps, Snippet } from 'svelte';
  let { children, ...args }: Omit<ComponentProps<typeof EmptyState>, 'children'> & { children?: string | Snippet } = $props();
</script>

<EmptyState {...args} >{#if typeof children === 'function'}{@render children()}{:else}{children}{/if}</EmptyState>
