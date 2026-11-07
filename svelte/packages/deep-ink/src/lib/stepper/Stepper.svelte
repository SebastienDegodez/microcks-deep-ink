<!--
  Numbered steps in an <ol> (registry item stepper); the current step has aria-current="step". Same props as the React
  Stepper: label, steps, variant, direction, doneLabel, marker, className plus any <ol> attribute and React handler
  (onClick...). A step's `label` and `n` (ReactNode in React) take a string or a snippet.
-->
<script lang="ts" module>
  import type { Snippet } from 'svelte';

  export interface StepperStep {
    label: string | Snippet;
    /** `progress` only. Default `upcoming`. */
    state?: 'done' | 'current' | 'upcoming';
    /** Shown number; defaults to the position (1, 2, 3). */
    n?: string | number | Snippet;
    id?: string;
  }
</script>

<script lang="ts">
  import type { HTMLOlAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLOlAttributes, 'class' | 'children'> &
    ReactHandlers<HTMLOListElement> & {
    /** Accessible name of the list ("Progress"). Optional: leave it out when the heading above names the list. */
    label?: string;
    steps: StepperStep[];
    /** `progress` (default): numbered dots. `list`: numbered instructions. */
    variant?: 'progress' | 'list';
    /** `progress` only: stack the steps. */
    direction?: 'horizontal' | 'vertical';
    /** Hidden word read after a done step (default "done"). */
    doneLabel?: string;
    /** `list` only. `number` (default): a mono "1.". `circle`: the number in a 22px ring. */
    marker?: 'number' | 'circle';
    className?: string;
  };

  let { label, steps, variant = 'progress', direction = 'horizontal', doneLabel = 'done', marker = 'number', className, ...rest }: Props = $props();
</script>

{#snippet num(s: StepperStep, i: number)}{#if s.n == null}{i + 1}{:else if typeof s.n === 'function'}{@render s.n()}{:else}{s.n}{/if}{/snippet}
{#snippet text(s: StepperStep)}{#if typeof s.label === 'function'}{@render s.label()}{:else}{s.label}{/if}{/snippet}

<ol
  {...reactEvents(rest)}
  aria-label={label}
  class={['stepper', className].filter(Boolean).join(' ')}
  data-variant={variant}
  data-direction={direction === 'vertical' ? 'vertical' : undefined}
  data-marker={variant === 'list' && marker === 'circle' ? 'circle' : undefined}
  >{#each steps as s, i (s.id ?? i)}{#if variant === 'list'}<li
        ><span class="stepper-n" aria-hidden="true">{@render num(s, i)}{marker === 'circle' ? '' : '.'}</span><span
          >{@render text(s)}</span
        ></li
      >{:else}<li data-state={s.state === 'done' ? 'done' : undefined} aria-current={s.state === 'current' ? 'step' : undefined}
        ><span class="stepper-dot">{@render num(s, i)}</span>{@render text(s)}{#if s.state === 'done'}<span class="sr-only"
            >, {doneLabel}</span
          >{/if}</li
      >{/if}{/each}</ol
>
