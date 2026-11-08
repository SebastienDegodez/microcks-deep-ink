<script lang="ts">
  import { AppShell } from '@microcks/deep-ink';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof AppShell> = $props();
</script>

<div style="height:420px;transform:translateZ(0)"><AppShell {...args} /></div>
