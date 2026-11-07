<script lang="ts" module>
  export { PROTOCOL_ATTR } from '../contracts.js';
  export type { Protocol } from '../types.js';
</script>

<script lang="ts">
  import MethodTag from '../MethodTag.svelte';
  import type { MethodTagProps } from '../types.js';
  let props: MethodTagProps = $props();
</script>

<MethodTag {...props} />
