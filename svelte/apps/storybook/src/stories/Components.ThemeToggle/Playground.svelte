<script lang="ts">
  import { ThemeToggle } from '@microcks/deep-ink';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof ThemeToggle> = $props();
</script>

<ThemeToggle {...args} />
