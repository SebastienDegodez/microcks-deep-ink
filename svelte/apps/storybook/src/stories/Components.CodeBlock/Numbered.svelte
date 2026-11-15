<script lang="ts">
  import { CodeBlock } from '@microcks/deep-ink';
</script>

<CodeBlock variant="plain" caption="Response body" lineNumbers lines={[{ text: '{' }, { text: '  "name": "Eclair Cafe",' }, { text: '  "price": "2.5"', bad: true, note: 'schema: number' }, { text: '}' }]} />
