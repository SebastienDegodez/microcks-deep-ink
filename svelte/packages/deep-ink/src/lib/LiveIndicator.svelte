<script lang="ts">
  import type { LiveIndicatorProps } from './types.js';
  import Glyph from './internal/Glyph.svelte';
  let { label = 'live', paused = false, pausedLabel, size = 'md', variant = 'pill', pulse = true, class: className, ...rest }: LiveIndicatorProps = $props();
</script>

{#snippet text()}
  {#if paused && pausedLabel}
    {pausedLabel}
  {:else}
    {label}{#if paused}<span class="live-paused">{' · paused'}</span>{/if}
  {/if}
{/snippet}

<span {...rest} class={['live', className]} data-paused={paused ? '' : undefined} data-size={size} data-variant={variant} data-pulse={pulse ? undefined : 'false'}>
  {#if paused}<Glyph name="pause" size={10} />{:else}<span class="live-dot" aria-hidden="true"></span>{/if}
  {#if variant === 'dot'}<span class="sr-only">{@render text()}</span>{:else}{@render text()}{/if}
</span>
