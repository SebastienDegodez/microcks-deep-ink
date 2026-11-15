<script lang="ts">
  import { CodeBlock } from '@microcks/deep-ink';
</script>

<CodeBlock variant="plain" caption="Response body" lineNumbers gutter="narrow" tone="danger" lines={[{ text: '{' }, { text: '  "name": "Eclair Cafe",' }, { text: '  "price": "3.9"', bad: true, note: 'schema: number' }, { text: '}' }]} />
