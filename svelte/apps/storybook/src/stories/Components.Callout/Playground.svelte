<script lang="ts">
  import { Callout } from '@microcks/deep-ink';
  import type { ComponentProps, Snippet } from 'svelte';
  let { children, ...args }: Omit<ComponentProps<typeof Callout>, 'children'> & { children?: string | Snippet } = $props();
</script>

<Callout {...args} >{#if typeof children === 'function'}{@render children()}{:else}{children}{/if}</Callout>
