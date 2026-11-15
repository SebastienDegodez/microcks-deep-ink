
<script lang="ts">
  import CommandBar from '../../src/lib/command-bar/CommandBar.svelte';
  import type { CommandItem } from '../../src/lib/command-bar/command-bar';

  let { items, oncommand, onclose }: { items: CommandItem[]; oncommand?: (i: CommandItem) => void; onclose?: () => void } = $props();
  let open = $state(false);
</script>

<button type="button" onclick={() => (open = true)}>Search</button>
<CommandBar
  {items}
  {open}
  label="Search and commands"
  {oncommand}
  onclose={() => {
    onclose?.();
    open = false;
  }}
/>
