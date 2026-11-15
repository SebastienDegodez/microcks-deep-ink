<script lang="ts">
  import { Field } from '@microcks/deep-ink';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof Field> = $props();
</script>

<Field {...args} />
