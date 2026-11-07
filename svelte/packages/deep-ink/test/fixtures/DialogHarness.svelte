<!-- The React spec's Harness: an opener button and a Dialog with a description, a text field and two footer buttons. -->
<script lang="ts">
  import Button from '../../src/lib/button/Button.svelte';
  import Dialog from '../../src/lib/dialog/Dialog.svelte';

  let { autofocus = false, onClose }: { autofocus?: boolean; onClose?: () => void } = $props();
  let open = $state(false);
</script>

<Button onclick={() => (open = true)}>Open dialog</Button>
<Dialog
  {open}
  onClose={() => {
    onClose?.();
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
