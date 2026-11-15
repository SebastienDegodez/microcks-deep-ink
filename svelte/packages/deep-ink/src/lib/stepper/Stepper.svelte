<script lang="ts" generics="Step extends StepperStep">
  import type { StepperProps, StepperStep } from './types.js';
  let { label, steps, renderLabel, variant = 'progress', direction = 'horizontal', doneLabel = 'done', marker = 'number', class: cssClass, ...rest }: StepperProps<Step> = $props();
</script>
<ol {...rest} aria-label={label} class={['stepper', cssClass].filter(Boolean).join(' ')} data-variant={variant} data-direction={direction === 'vertical' ? 'vertical' : undefined} data-marker={variant === 'list' && marker === 'circle' ? 'circle' : undefined}>
  {#each steps as step, i (step.id ?? i)}{@const n = step.n ?? i + 1}{@const state = step.state ?? 'upcoming'}
    {#if variant === 'list'}<li><span class="stepper-n" aria-hidden="true">{#if typeof n === 'function'}{@render n()}{:else}{n}{/if}{marker === 'circle' ? '' : '.'}</span><span>{#if renderLabel}{@render renderLabel(step, i)}{:else if typeof step.label === 'function'}{@render step.label()}{:else}{step.label}{/if}</span></li>
    {:else}<li data-state={state === 'done' ? 'done' : undefined} aria-current={state === 'current' ? 'step' : undefined}><span class="stepper-dot">{#if typeof n === 'function'}{@render n()}{:else}{n}{/if}</span>{#if renderLabel}{@render renderLabel(step, i)}{:else if typeof step.label === 'function'}{@render step.label()}{:else}{step.label}{/if}{#if state === 'done'}<span class="sr-only">, {doneLabel}</span>{/if}</li>{/if}
  {/each}
</ol>
