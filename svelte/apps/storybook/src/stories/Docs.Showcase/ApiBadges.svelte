<script lang="ts">
  import { ApiBadge } from '@microcks/deep-ink';
  import type { Protocol } from '@microcks/deep-ink';
  import Frame from './Frame.svelte';
  const badges: [Protocol, string, string][] = [['REST', 'API Pastry', '2.0'], ['SOAP', 'HelloService', '0.9'], ['EVENT', 'Pastry orders API', '0.1.0'], ['gRPC', 'HelloService', 'v1'], ['GRAPHQL', 'Movie Graph', '1.0'], ['DIRECT', 'Direct', '1.0'], ['A2A', 'Pastry concierge', '1.0']];
</script>
<Frame label="API badges">
  <p class="sb-note">Type, name, version: the visible text is the accessible name. The protocol colour identifies the API type; the type is always written too.</p>
  <div class="inline">{#each badges as [protocol, name, version] (protocol)}<ApiBadge {protocol} {name} {version} />{/each}<ApiBadge arazzo name="restock-pastry" /></div>
  <div class="inline"><ApiBadge label="conformance" value="92 %" status="success" /><ApiBadge label="last run" value="2 failures" status="danger" /><ApiBadge label="drift" value="1 field" status="warning" /></div>
</Frame>
