<script lang="ts">
  import { useAutoFocus } from '../focus.svelte.js';

  let { open }: { open: boolean } = $props();
  let panel = $state<HTMLDivElement>();
  useAutoFocus(
    () => panel,
    () => open,
  );
</script>

<div bind:this={panel}>
  <p>Text</p>
  <input aria-label="First" />
  <input aria-label="Second" />
</div>
