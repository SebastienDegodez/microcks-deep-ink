<script lang="ts">
  import { CodeBlock } from '@microcks/deep-ink';
</script>

<div class="stack"><CodeBlock caption="SendMessage · curl" label="SendMessage · curl, JSON-RPC binding" code={"curl -X POST https://agent.acme.io/a2a -d '{\"jsonrpc\":\"2.0\",\"method\":\"message/send\"}'"} /><CodeBlock caption="SendMessage · curl" label="SendMessage · curl, HTTP+JSON binding" code="curl -X POST https://agent.acme.io/v1/message:send" /></div>
