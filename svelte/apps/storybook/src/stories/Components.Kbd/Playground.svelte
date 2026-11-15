<script lang="ts">
  import { Kbd } from '@microcks/deep-ink';
  import type { ComponentProps, Snippet } from 'svelte';
  let { children, ...args }: Omit<ComponentProps<typeof Kbd>, 'children'> & { children?: string | Snippet } = $props();
</script>

<Kbd {...args} >{#if typeof children === 'function'}{@render children()}{:else}{children}{/if}</Kbd>
