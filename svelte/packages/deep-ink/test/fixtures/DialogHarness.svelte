
<script lang="ts">
  import Button from '../../src/lib/Button.svelte';
  import Dialog from '../../src/lib/dialog/Dialog.svelte';

  let { autofocus = false, onclose }: { autofocus?: boolean; onclose?: () => void } = $props();
  let open = $state(false);
</script>

<Button onclick={() => (open = true)}>Open dialog</Button>
<Dialog
  {open}
  onclose={() => {
    onclose?.();
    open = false;
  }}
  title="Delete API Pastry?"
  description="This cannot be undone."
>
  <label>Reason <input type="text" /></label>
  {#snippet footer()}
    <Button data-autofocus={autofocus ? '' : undefined}>Cancel</Button>
    <Button variant="danger">Delete</Button>
  {/snippet}
</Dialog>
