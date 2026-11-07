<!-- Renders one parity case: the component with the case props and, when given, a text child. -->
<script lang="ts">
  import type { Component } from 'svelte';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { component: C, props = {}, text }: { component: Component<any>; props?: Record<string, unknown>; text?: string } = $props();
</script>

{#if text === undefined}
  <C {...props} />
{:else}
  <C {...props}>{text}</C>
{/if}
