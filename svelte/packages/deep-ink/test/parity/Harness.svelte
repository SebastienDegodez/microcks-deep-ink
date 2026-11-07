<!-- Renders one parity case: the component with the case props and, when given, a text child or <option> children. -->
<script lang="ts">
  import type { Component } from 'svelte';
  import type { ParityOption } from './parity';

  let {
    component: C,
    props = {},
    text,
    options,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: Component<any>;
    props?: Record<string, unknown>;
    text?: string;
    options?: ParityOption[];
  } = $props();
</script>

{#if options}
  <C {...props}>
    {#each options as o (o.label)}
      {#if o.value === undefined}<option disabled={o.disabled}>{o.label}</option>
      {:else}<option value={o.value} disabled={o.disabled}>{o.label}</option>{/if}
    {/each}
  </C>
{:else if text === undefined}
  <C {...props} />
{:else}
  <C {...props}>{text}</C>
{/if}
