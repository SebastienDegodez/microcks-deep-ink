<script lang="ts">
  import { useAutoFocus, useReturnFocus } from '../focus.svelte.js';

  let open = $state(false);
  let opener = $state<HTMLButtonElement>();
  let form = $state<HTMLFormElement>();
  const { focusLater } = useReturnFocus();
  useAutoFocus(
    () => form,
    () => open,
  );

  function cancel() {
    open = false;
    focusLater(() => opener);
  }
</script>

<div>
  {#if open}
    <form bind:this={form} aria-label="Add header">
      <input aria-label="Name" />
      <input aria-label="Value" data-autofocus />
      <button type="button" onclick={cancel}>Cancel</button>
    </form>
  {:else}
    <button type="button" bind:this={opener} onclick={() => (open = true)}>Add header</button>
  {/if}
</div>
