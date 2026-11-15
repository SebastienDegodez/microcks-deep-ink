<script lang="ts">
 import { ApiBadge } from '@microcks/deep-ink';
 import type { Protocol } from '@microcks/deep-ink';
 let { variant = 'Default' }: { variant?: string } = $props();
 const protocols: Array<[Protocol, string, string]> = [['REST','API Pastry','2.0'],['SOAP','HelloService','0.9'],['EVENT','Pastry orders API','0.1.0'],['gRPC','HelloService','v1'],['GRAPHQL','Movie Graph','1.0'],['DIRECT','Direct','1.0'],['A2A','Pastry concierge','1.0']];
</script>
{#if variant === 'Default'}<div class="inline">{#each protocols as [p,n,v] (p)}<ApiBadge protocol={p} name={n} version={v} />{/each}</div>
{:else if variant === 'MutedVersion'}<div class="inline"><ApiBadge protocol="REST" name="API Pastry" version="2.0" versionTone="muted" /><ApiBadge protocol="EVENT" name="Pastry orders" version="0.1.0" versionTone="muted" size="lg" /></div>
{:else if variant === 'Small'}<ApiBadge size="sm" protocol="REST" name="API Pastry" version="2.0" />
{:else if variant === 'Workflow'}<ApiBadge arazzo name="restock-pastry" />
{:else if variant === 'Proof'}<div class="inline"><ApiBadge label="conformance" value="92 %" status="success" /><ApiBadge label="last run" value="2 failures" status="danger" /><ApiBadge label="drift" value="1 field" status="warning" /><ApiBadge label="replayed" value="1,204 msgs" /></div>
{:else if variant === 'PageHeader'}<div class="stack"><h1 style="margin:0"><ApiBadge size="xl" protocol="REST" name="API Pastry" version="2.0" /></h1><ApiBadge size="lg" protocol="REST" name="API Pastry" version="2.0" /></div>
{:else if variant === 'ProofValues'}<ApiBadge label="samples" value="7" values={[{value:'+1 AI',status:'warning'}]} />
{:else if variant === 'Card'}<div class="stack" style="max-width:260px"><ApiBadge size="card" protocol="REST" name="API Pastry" version="2.0" /><ApiBadge size="card" protocol="EVENT" name="Pastry orders API with a long name" version="0.1.0" /><ApiBadge label="conformance" value="untested" status="neutral" /></div>
{:else if variant === 'CompactAndMuted'}<div class="inline"><ApiBadge size="compact" protocol="REST" name="API Pastry" version="2.0" /><ApiBadge size="sm" protocol="REST" name="4" /><ApiBadge size="compact" label="last import" value="inactive" status="muted" /><ApiBadge size="card" label="conformance" value="untested" status="neutral" /></div>
{:else if variant === 'WorkflowHeader'}<div style="display:flex;flex-direction:column;gap:16px;align-items:flex-start"><ApiBadge arazzo name="Restock a pastry" version="1.2.0" size="xl" /><div class="inline"><ApiBadge size="compact" label="target" value="Implementations · schema validation" status="plain" /><ApiBadge size="compact" label="runs · 7 d" value="2/4 passed" status="text" /><ApiBadge size="compact" label="mock url" value="ready" status="positive" /></div></div>
{:else if variant === 'ProofIcons'}<div class="inline"><ApiBadge size="compact" label="result" value="failed" status="danger" icon="close-sm" /><ApiBadge size="compact" label="result" value="passed" status="success" icon="check" /><ApiBadge size="compact" label="last test" value="13/15" status="danger" icon="close-sm" /><ApiBadge size="compact" label="skills" value="3" status="protocol" protocol="A2A" /><ApiBadge size="compact" label="streaming" status="success" icon="check" iconLabel="supported" /><ApiBadge protocol="REST" name="API Pastry" version="2.0" versionTone="text" /></div>
{:else}<ApiBadge protocol="REST" name="API Pastry" version="2.0" />{/if}
