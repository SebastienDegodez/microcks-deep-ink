<script lang="ts">
  import { CodeBlock } from '@microcks/deep-ink';
  let tab = $state('request');
</script>

<div style="max-width:560px"><CodeBlock language="json" lineNumbers startLine={41} tabs={[{ id: 'request', label: 'Request' }, { id: 'response', label: 'Response' }]} tab={tab} ontabchange={(value) => (tab = value)} tabsLabel="Exchange parts" code={tab === 'request' ? '{\n  "name": "Millefeuille"\n}' : '{\n  "name": "Millefeuille",\n  "price": 3.9\n}'} /></div>
