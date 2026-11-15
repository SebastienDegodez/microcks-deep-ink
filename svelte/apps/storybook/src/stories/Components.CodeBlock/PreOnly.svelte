<script lang="ts">
  import { CodeBlock } from '@microcks/deep-ink';
</script>

<div class="stack" style="max-width:360px"><CodeBlock frame="none" variant="bare" label="Input schema of getPastry" style="padding:10px 12px;border-radius:4px" code={'{\n  "type": "object",\n  "properties": { "name": { "type": "string" } }\n}'} /><CodeBlock frame="none" variant="plain" focusable="overflow" label="Long command" code={'curl -X PATCH http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille -d \'{"price": 3.9}\''} /><CodeBlock frame="none" variant="plain" focusable="never" code={'{"dispatcher": "URI_PARTS"}'} /></div>
