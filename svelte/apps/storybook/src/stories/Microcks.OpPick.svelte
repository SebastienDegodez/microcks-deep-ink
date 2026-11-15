<script lang="ts">
 import { OpPickList, SectionLabel } from '@microcks/deep-ink';
 import type { OpPickOption } from '@microcks/deep-ink';
 let { variant = 'ServiceRail' }: { variant?: string } = $props();
 let value = $state('list');
 const rail: OpPickOption[] = [{id:'list',method:'GET',path:'/pastries',summary:'List pastries by size',meta:'3 examples · +1 AI',end:'812',endLabel:'Calls over 7 days: '},{id:'get',method:'GET',path:'/pastries/{name}',summary:'Get a pastry by its name',meta:'2 examples',end:'340',endLabel:'Calls over 7 days: '},{id:'patch',method:'PATCH',path:'/pastries/{name}',summary:'Update a pastry price',meta:'2 examples',end:'96',endLabel:'Calls over 7 days: '}];
 const ops: OpPickOption[] = rail.map((o,i)=>({id:o.id,method:o.method,path:o.path,summary:`${3-i} examples`,end:i===0?'+2 pending':i===1?'+1 accepted':undefined,endTone:i===0?'warning':'success'}));
</script>
{#if variant === 'ServiceRail'}<div style="max-width:360px"><OpPickList label="Operations" options={rail} value={value} onchange={(id)=>value=id} /></div>
{:else if variant === 'Copilot'}<section aria-labelledby="op-story" style="max-width:380px;display:flex;flex-direction:column;gap:8px"><SectionLabel as="h2" id="op-story" size="sm">1 · Operation</SectionLabel><OpPickList mode="radio" labelledBy="op-story" options={ops} value={value} onchange={(id)=>value=id} /></section>{/if}
