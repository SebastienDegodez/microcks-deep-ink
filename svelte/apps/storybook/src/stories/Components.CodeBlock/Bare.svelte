<script lang="ts">
  import { CodeBlock } from '@microcks/deep-ink';
</script>

<div class="stack" style="max-width:360px"><div style="padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-panel);background:var(--bg)"><CodeBlock variant="bare" caption="Sample body" focusable="overflow" code={'{"name": "Millefeuille"}'} /></div><div style="padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-panel);background:var(--bg)"><CodeBlock variant="bare" caption="Long sample" focusable="overflow" code={'curl -X PATCH http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille -d \'{"price": 3.9}\''} /></div></div>
