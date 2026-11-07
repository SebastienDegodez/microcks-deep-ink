<!--
  Marks a real-time stream (registry item live-indicator). Same props as the React LiveIndicator: label, paused,
  pausedLabel, size, variant, className plus any <span> attribute and React handler (onClick...). Not a status and not
  a live region: announce stream changes elsewhere, and pair it with a Pause control.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from '../icon/Icon.svelte';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> &
    ReactHandlers<HTMLSpanElement> & {
    label?: string;
    /** The stream is paused: a pause glyph replaces the dot and "paused" is written. */
    paused?: boolean;
    /** Text shown while paused, instead of "<label> · paused": "paused · 2 new calls". Write the word "paused". */
    pausedLabel?: string;
    /** `sm`: 11px, padding 2px 8px. `lg` (box only): 44px, 13px. */
    size?: 'md' | 'sm' | 'lg';
    /** `inline`: no pill border. `box`: a dashed frame in place of a busy button. `dot`: the dot only, the label visually hidden. */
    variant?: 'pill' | 'inline' | 'box' | 'dot';
    className?: string;
  };

  // The leading space is part of the text (Svelte trims it when written as a literal).
  const PAUSED = ' · paused';

  let { label = 'live', paused, pausedLabel, size = 'md', variant = 'pill', className, ...rest }: Props = $props();
</script>

{#snippet text()}{#if paused && pausedLabel}{pausedLabel}{:else}{label}{#if paused}<span class="live-paused">{PAUSED}</span>{/if}{/if}{/snippet}

<span
  {...reactEvents(rest)}
  class={['live', className].filter(Boolean).join(' ')}
  data-paused={paused ? '' : undefined}
  data-size={size}
  data-variant={variant}
  >{#if paused}<Icon name="pause" size={10} />{:else}<span class="live-dot" aria-hidden="true"></span>{/if}{#if variant === 'dot'}<span
      class="sr-only">{@render text()}</span
    >{:else}{@render text()}{/if}</span
>
