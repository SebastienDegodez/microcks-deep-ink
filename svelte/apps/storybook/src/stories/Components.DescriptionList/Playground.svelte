<script lang="ts">
  import { DescriptionList } from '@microcks/deep-ink';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof DescriptionList> = $props();
</script>

<DescriptionList {...args} />
