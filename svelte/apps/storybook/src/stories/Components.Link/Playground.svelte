<script lang="ts">
  import { Link } from '@microcks/deep-ink';
  import type { ComponentProps, Snippet } from 'svelte';
  let { children, ...args }: Omit<ComponentProps<typeof Link>, 'children'> & { children?: string | Snippet } = $props();
</script>

<Link {...args} >{#if typeof children === 'function'}{@render children()}{:else}{children}{/if}</Link>
