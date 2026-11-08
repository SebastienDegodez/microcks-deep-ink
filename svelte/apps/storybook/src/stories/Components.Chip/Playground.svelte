<script lang="ts">
  import { Chip } from '@microcks/deep-ink';
  import type { ComponentProps, Snippet } from 'svelte';
  let { children, ...args }: Omit<ComponentProps<typeof Chip>, 'children'> & { children?: string | Snippet } = $props();
</script>

<Chip {...args} >{#if typeof children === 'function'}{@render children()}{:else}{children}{/if}</Chip>
