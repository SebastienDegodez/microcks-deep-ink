<script lang="ts">
  import { CodeBlock } from '@microcks/deep-ink';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof CodeBlock> = $props();
</script>

<CodeBlock {...args} />
