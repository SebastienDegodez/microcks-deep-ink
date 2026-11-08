<script lang="ts">
  import { Button } from '@microcks/deep-ink';
  import { Dialog } from '@microcks/deep-ink';
  let { danger }: { danger?: boolean } = $props();
  let open = $state(false);
</script>

<Button variant={danger ? 'danger' : 'primary'} onclick={() => (open = true)}>{danger ? 'Delete service' : 'Import a contract'}</Button><Dialog open={open} onclose={() => (open = false)} title={danger ? 'Delete API Pastry 2.0?' : 'Import a contract'} description={danger ? 'The service, its examples and its test history are removed. This cannot be undone.' : 'Choose an OpenAPI, AsyncAPI, gRPC or GraphQL file.'}>{#snippet footer()}<Button variant="ghost" onclick={() => (open = false)}>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} onclick={() => (open = false)}>{danger ? 'Delete' : 'Import'}</Button>{/snippet}<p style="margin:0">{danger ? 'Type the service name to confirm in a real product.' : 'Drag a file here or choose one.'}</p></Dialog>
