<!-- Renders one parity case: the component with the case props and, when given, a text child (an array of them as the `children` prop), <option> children or a render-prop control. -->
<script lang="ts">
  import type { Component } from 'svelte';
  import type { ParityOption } from './parity';

  let {
    component: C,
    props = {},
    text,
    options,
    control,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: Component<any>;
    props?: Record<string, unknown>;
    text?: string | string[];
    options?: ParityOption[];
    control?: { component: unknown; props?: Record<string, unknown> };
  } = $props();
</script>

{#if control}
  {@const Control = control.component as Component<Record<string, unknown>>}
  <C {...props}>
    {#snippet children(p: Record<string, unknown>)}<Control {...p} {...control.props} />{/snippet}
  </C>
{:else if options}
  <C {...props}>
    {#each options as o (o.label)}
      {#if o.value === undefined}<option disabled={o.disabled}>{o.label}</option>
      {:else}<option value={o.value} disabled={o.disabled}>{o.label}</option>{/if}
    {/each}
  </C>
{:else if Array.isArray(text)}
  <C {...props} children={text} />
{:else if text === undefined}
  <C {...props} />
{:else}
  <C {...props}>{text}</C>
{/if}
