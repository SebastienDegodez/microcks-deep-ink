<script lang="ts">
 import { OperationList, OperationRow } from '@microcks/deep-ink';
 import type { OperationRowProps } from '@microcks/deep-ink';
 import { OPERATIONS } from '@microcks-deep-ink/storybook-shared/fixtures';
 let { variant = 'Default', ...props }: { variant?: string } & Partial<OperationRowProps> = $props(); let selected = $state(1);
</script>
{#if variant === 'Default'}<div style="max-width:720px"><OperationList label="Operations of API Pastry 2.0">{#each OPERATIONS as op,i (`${op.method}${op.path}`)}<OperationRow {...op} selected={selected===i} onselect={()=>selected=i} />{/each}</OperationList></div>
{:else if variant === 'ProtocolAndMockUrl'}<OperationList label="Operations of Pastry orders"><OperationRow method="SUBSCRIBE" protocol="EVENT" path="pastry/orders" meta="1 message" mockUrl="kafka://localhost:9092/pastry-orders" /><OperationRow method="GET" path="/pastries" meta="3 examples" mockUrl="http://localhost:8080/rest/API+Pastry/2.0.0/pastries" /></OperationList>
{:else if variant === 'Playground'}<OperationList label="Operations"><OperationRow method={props.method ?? 'GET'} path={props.path ?? '/pastries/{name}'} {...props} /></OperationList>
{:else}<div style="max-width:720px"><OperationList label="Operations of API Pastry 2.0">{#each OPERATIONS as op,i (`${op.method}${op.path}`)}<OperationRow method={op.method} path={op.path} meta={op.meta} href={`#op-${i}`} selected={i===0} />{/each}</OperationList></div>{/if}
