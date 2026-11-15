<script lang="ts">
  import { Button } from '@microcks/deep-ink';
  import { EmptyState } from '@microcks/deep-ink';
</script>

<EmptyState title="No services yet">{#snippet actions()}<Button variant="primary" icon="upload">Import a contract</Button>{/snippet}Import an OpenAPI, AsyncAPI, gRPC or GraphQL contract to create your first mock.</EmptyState>
