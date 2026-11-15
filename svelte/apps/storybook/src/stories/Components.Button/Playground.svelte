<script lang="ts">
import { Button, ButtonLink } from '@microcks/deep-ink';
import { untrack } from 'svelte';

import type { ComponentProps, Snippet } from 'svelte';
let { children, ...args }: Omit<ComponentProps<typeof Button>, 'children'> & { children?: string | Snippet } = $props();

</script>

<Button {...args} >{#if typeof children === 'function'}{@render children()}{:else}{children}{/if}</Button>
