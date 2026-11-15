<script lang="ts">
  import { Disclosure } from '@microcks/deep-ink';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof Disclosure> = $props();
</script>

<Disclosure {...args} />
