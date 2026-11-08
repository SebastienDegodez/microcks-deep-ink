<script lang="ts">
import { DropZone } from '@microcks/deep-ink';

let names = $state<string[]>([]);
</script>
<div class="stack" style="max-width: 560px"><DropZone heading="Import a contract" hint="OpenAPI, AsyncAPI, gRPC, GraphQL or Postman" accept=".yaml,.yml,.json,.proto,.graphql" onfiles={(f) => names = f.map((x) => x.name)} />{#if names.length}<p class="sb-note">Selected: {names.join(', ')}</p>{/if}</div>
