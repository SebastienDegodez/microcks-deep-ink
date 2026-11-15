<script lang="ts">
 import { AiGhostRow, MethodTag } from '@microcks/deep-ink';
 let { variant='Default', name='listPastries', busy=false }: { variant?: string; name?: string; busy?: boolean } = $props(); let message=$state('');
</script>
{#if variant === 'Default'}<div class="stack" style="max-width:720px"><AiGhostRow name="getPastry example" onaccept={()=>message='Accepted'} onedit={()=>message='Editing'} onreject={()=>message='Rejected'}><MethodTag method="GET" /> <code>/pastries/Eclair</code> → 200 <code>{'{ "name": "Eclair" }'}</code></AiGhostRow><p role="status" class="sb-note">{message}</p></div>
{:else if variant === 'Playground'}<AiGhostRow {name} {busy} onaccept={()=>{}} onedit={()=>{}} onreject={()=>{}}><MethodTag method="GET" /> /pastries: suggested operation</AiGhostRow>
{:else if variant === 'Busy'}<div style="max-width:720px"><AiGhostRow name="postPastry example" busy onaccept={()=>{}} onedit={()=>{}} onreject={()=>{}}><MethodTag method="POST" /> <code>/pastries</code> → 201</AiGhostRow></div>{/if}
