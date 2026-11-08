<script lang="ts">
  import { Button } from '@microcks/deep-ink';
  import { Dialog } from '@microcks/deep-ink';
  let { size, closeOnBackdrop }: { size: 'sm' | 'lg'; closeOnBackdrop?: boolean } = $props();
  let open = $state(false);
</script>

<Button onclick={() => (open = true)}>{`Open the ${size === 'sm' ? 'small' : 'large'} dialog`}</Button><Dialog open={open} onclose={() => (open = false)} size={size} closeOnBackdrop={closeOnBackdrop} title={size === 'sm' ? 'Discard changes?' : 'Operation details'} description={closeOnBackdrop ? 'A click on the backdrop closes this dialog.' : undefined}>{#snippet footer()}<Button variant="ghost" onclick={() => (open = false)}>Close</Button>{/snippet}<p style="margin:0">{size === 'sm' ? 'Your edits are not saved.' : 'A wide dialog for forms and tables.'}</p></Dialog>
