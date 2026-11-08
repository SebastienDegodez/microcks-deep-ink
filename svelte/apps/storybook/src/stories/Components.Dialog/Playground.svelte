<script lang="ts">
  import { Button } from '@microcks/deep-ink';
  import { Dialog } from '@microcks/deep-ink';
  import type { ComponentProps } from 'svelte';
  let args: ComponentProps<typeof Dialog> = $props();
  let open = $state(false);
</script>

<Button variant="primary" onclick={() => (open = true)}>Open the dialog</Button><Dialog {...args} open={open} onclose={() => (open = false)}>{#snippet footer()}<Button onclick={() => (open = false)}>Close</Button>{/snippet}</Dialog>
