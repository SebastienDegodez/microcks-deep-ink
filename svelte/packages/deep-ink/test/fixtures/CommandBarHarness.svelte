<!-- The React spec's Harness: an opener button and a controlled modal CommandBar, closed from onClose. -->
<script lang="ts">
  import CommandBar from '../../src/lib/command-bar/CommandBar.svelte';
  import type { CommandItem } from '../../src/lib/command-bar/command-bar';

  let { items, onCommand, onClose }: { items: CommandItem[]; onCommand?: (i: CommandItem) => void; onClose?: () => void } = $props();
  let open = $state(false);
</script>

<button type="button" onclick={() => (open = true)}>Search</button>
<CommandBar
  {items}
  {open}
  label="Search and commands"
  {onCommand}
  onClose={() => {
    onClose?.();
    open = false;
  }}
/>
